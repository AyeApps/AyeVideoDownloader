import Foundation
import Combine
import AppKit

enum ProcessingMode: String, CaseIterable, Identifiable {
    case cloud = "Nube (Cloud)"
    case local = "Local (Mac)"
    var id: String { rawValue }
}

class DownloadManager: ObservableObject {

    // Global settings
    @Published var processingMode: ProcessingMode = .cloud {
        didSet {
            UserDefaults.standard.set(processingMode.rawValue, forKey: "AyeVideo_ProcessingMode")
        }
    }
    @Published var globalQuality: VideoQuality = .best
    @Published var globalCodec: VideoCodec = .any
    @Published var globalHDR: DynamicRangePreference = .any
    @Published var cookieBrowser: CookieBrowser = .none

    @Published var items: [DownloadItem] = []
    @Published var outputDirectory: URL = FileManager.default.urls(for: .downloadsDirectory, in: .userDomainMask).first!
    @Published var ytdlpMissing = false // Kept for compatibility with ContentView
    @Published var ffmpegMissing = false // Kept for compatibility with ContentView
    
    private let network = NetworkService.shared

    init() {
        if let saved = UserDefaults.standard.string(forKey: "AyeVideo_ProcessingMode"),
           let mode = ProcessingMode(rawValue: saved) {
            self.processingMode = mode
        } else {
            self.processingMode = .cloud
        }
    }

    // MARK: - Public API

    func add(url: String, format: DownloadFormat) {
        guard !url.trimmingCharacters(in: .whitespaces).isEmpty else { return }
        let item = DownloadItem(url: url.trimmingCharacters(in: .whitespaces), format: format)
        DispatchQueue.main.async { self.items.append(item) }
    }

    func startAll() {
        let waitingItems = items.filter { if case .waiting = $0.status { return true }; return false }
        for item in waitingItems {
            Task {
                await start(item: item)
            }
        }
    }

    func cancel(_ item: DownloadItem) {
        if processingMode == .local {
            item.localProcess?.terminate()
            item.localProcess = nil
        } else {
            item.sseClient?.disconnect()
            
            Task {
                if let jobId = item.jobId {
                    _ = try? await network.rawRequest("/downloads/\(jobId)", method: "DELETE")
                }
            }
        }
        
        DispatchQueue.main.async {
            self.objectWillChange.send()
            item.status = .cancelled
            item.progressText = ""
        }
    }

    func remove(_ item: DownloadItem) {
        cancel(item)
        DispatchQueue.main.async { self.items.removeAll { $0.id == item.id } }
    }

    func chooseOutputDirectory() {
        let panel = NSOpenPanel()
        panel.canChooseFiles = false
        panel.canChooseDirectories = true
        panel.allowsMultipleSelection = false
        panel.prompt = "Seleccionar"
        if panel.runModal() == .OK, let url = panel.url {
            DispatchQueue.main.async { self.outputDirectory = url }
        }
    }

    // MARK: - Per-video Format Detection

    func fetchAllFormats() {
        for item in items {
            if case .waiting = item.status, item.format == .videoMP4 {
                if case .idle = item.formatsState {
                    DispatchQueue.main.async { item.isCustomized = true }
                    fetchFormats(for: item)
                }
            }
        }
    }

    struct FetchFormatsRequest: Encodable {
        let url: String
    }

    struct FetchFormatsResponse: Decodable {
        let url: String
        let title: String?
        let duration: Int?
        let thumbnail: String?
        let formats: [AvailableFormatResponse]
    }

    struct AvailableFormatResponse: Decodable {
        let id: String
        let height: Int
        let fps: Double
        let vcodec: String
        let filesize: Int64?
        let dynamic_range: String?
    }

    func fetchFormats(for item: DownloadItem) {
        if processingMode == .local {
            fetchFormatsLocally(for: item)
            return
        }

        DispatchQueue.main.async {
            self.objectWillChange.send()
            item.formatsState = .loading
        }

        Task {
            do {
                let request = FetchFormatsRequest(url: item.url)
                let response: FetchFormatsResponse = try await network.request("/formats/fetch", method: "POST", body: request)
                
                let videoFormats: [AvailableFormat] = response.formats.map { f in
                    AvailableFormat(
                        id: f.id,
                        height: f.height,
                        fps: f.fps,
                        vcodec: f.vcodec,
                        filesize: f.filesize,
                        dynamicRange: f.dynamic_range
                    )
                }
                
                await MainActor.run {
                    self.objectWillChange.send()
                    if let t = response.title, !t.isEmpty { item.title = t }
                    item.formatsState = .loaded(videoFormats)
                    
                    let preferred = videoFormats.first {
                        item.customCodec.matches(vcodec: $0.vcodec) &&
                        (item.customHDR == .any || (item.customHDR == .hdr && $0.isHDR) || (item.customHDR == .sdr && !$0.isHDR))
                    }
                    item.selectedFormatID = (preferred ?? videoFormats.first)?.id
                }
            } catch {
                await MainActor.run {
                    self.objectWillChange.send()
                    item.formatsState = .failed
                }
            }
        }
    }

    // MARK: - Queue & Download

    private func start(item: DownloadItem) async {
        if processingMode == .local {
            await startLocal(item: item)
            return
        }

        await MainActor.run {
            self.objectWillChange.send()
            item.status = .downloading
            item.progress = 0.0
            item.progressText = "Preparando descarga en la nube..."
        }
        
        do {
            let quality = item.isCustomized ? item.customQuality.rawValue : self.globalQuality.rawValue
            let codec = item.isCustomized ? item.customCodec.rawValue : self.globalCodec.rawValue
            let hdr = item.isCustomized ? item.customHDR.rawValue : self.globalHDR.rawValue
            
            let request = CreateDownloadRequest(
                url: item.url,
                format: item.format == .videoMP4 ? "videoMP4" : "audioMP3",
                quality: quality,
                codec: codec,
                hdr: hdr,
                selected_format_id: item.isCustomized ? item.selectedFormatID : nil
            )
            
            let job: DownloadJobResponse = try await network.request(
                "/downloads/", method: "POST", body: request
            )
            
            await MainActor.run { item.jobId = job.job_id }
            
            await listenProgress(for: item)
        } catch {
            await MainActor.run {
                item.status = .failed(error.localizedDescription)
            }
        }
    }

    private func listenProgress(for item: DownloadItem) async {
        guard let jobId = item.jobId else { return }
        
        let token = await KeychainService.shared.getToken(.accessToken) ?? ""
        
        await MainActor.run {
            let client = SSEClient()
            item.sseClient = client
            
            client.connect(jobId: jobId, token: token) { [weak self] progress, event in
                guard let self = self else { return }
                
                Task { @MainActor in
                    if event == "done" {
                        item.progressText = "Descargando archivo final..."
                        Task { await self.downloadFile(for: item) }
                        client.disconnect()
                    } else if event == "error" {
                        item.status = .failed("Error en SSE")
                        client.disconnect()
                    } else if let p = progress {
                        item.progress = p.progress
                        item.progressText = p.progress_text
                        if let title = p.title, !title.isEmpty {
                            item.title = title
                        }
                        if p.status == "failed" {
                            item.status = .failed("Fallo en la nube")
                            client.disconnect()
                        } else if p.status == "cancelled" {
                            item.status = .cancelled
                            client.disconnect()
                        }
                    }
                }
            }
        }
    }

    func downloadFile(for item: DownloadItem) async {
        guard let jobId = item.jobId else { return }
        
        do {
            let data = try await network.downloadData("/downloads/\(jobId)/file")
            
            // Unique file name logic can be added, for now write directly to output
            let baseName = item.title.isEmpty ? "video" : item.title
            let ext = item.format == .audioMP3 ? "mp3" : "mp4"
            let safeName = baseName.replacingOccurrences(of: "/", with: "-")
            
            var destURL = outputDirectory.appendingPathComponent("\(safeName).\(ext)")
            
            // Ensure unique filename
            var counter = 1
            while FileManager.default.fileExists(atPath: destURL.path) {
                destURL = outputDirectory.appendingPathComponent("\(safeName) (\(counter)).\(ext)")
                counter += 1
            }
            
            try data.write(to: destURL)
            
            await MainActor.run {
                item.outputPath = destURL
                item.status = .done
                item.progress = 1.0
                item.progressText = "Completado"
            }
        } catch {
            await MainActor.run {
                item.status = .failed("Error al guardar archivo: \(error.localizedDescription)")
            }
        }
    }

    // MARK: - Local Download Processing

    private func getExecutablePath(name: String) -> String? {
        let commonPaths = [
            "/opt/homebrew/bin/\(name)",
            "/usr/local/bin/\(name)",
            "/usr/bin/\(name)",
            "/bin/\(name)"
        ]
        for path in commonPaths {
            if FileManager.default.fileExists(atPath: path) {
                return path
            }
        }
        
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/which")
        process.arguments = [name]
        
        let pipe = Pipe()
        process.standardOutput = pipe
        
        do {
            try process.run()
            process.waitUntilExit()
            if process.terminationStatus == 0 {
                let data = pipe.fileHandleForReading.readDataToEndOfFile()
                let path = String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? ""
                if !path.isEmpty && FileManager.default.fileExists(atPath: path) {
                    return path
                }
            }
        } catch {}
        
        return nil
    }

    func buildFormatString(quality: String, codec: String, hdr: String) -> String {
        let heightConstraint: String
        switch quality {
        case "best": heightConstraint = ""
        case "2160": heightConstraint = "[height<=2160]"
        case "1440": heightConstraint = "[height<=1440]"
        case "1080": heightConstraint = "[height<=1080]"
        case "720":  heightConstraint = "[height<=720]"
        case "480":  heightConstraint = "[height<=480]"
        case "360":  heightConstraint = "[height<=360]"
        default:     heightConstraint = ""
        }
        
        var codecConstraint = ""
        switch codec {
        case "any":  codecConstraint = ""
        case "h264": codecConstraint = "[vcodec~='^avc']"
        case "h265": codecConstraint = "[vcodec~='^(hev|hvc)']"
        case "vp9":  codecConstraint = "[vcodec~='^vp0?9']"
        case "av1":  codecConstraint = "[vcodec~='^av01']"
        default:     codecConstraint = ""
        }
        
        switch hdr {
        case "any": break
        case "sdr": codecConstraint += "[dynamic_range=SDR]"
        case "hdr": codecConstraint += "[dynamic_range!=SDR]"
        default:    break
        }
        
        if codecConstraint.isEmpty {
            return "bv\(heightConstraint)+ba[ext=m4a]/bv\(heightConstraint)+ba/b\(heightConstraint)[ext=mp4]/b\(heightConstraint)/best"
        } else {
            return "bv\(heightConstraint)\(codecConstraint)+ba[ext=m4a]/bv\(heightConstraint)\(codecConstraint)+ba/bv\(heightConstraint)+ba[ext=m4a]/bv\(heightConstraint)+ba/b\(heightConstraint)[ext=mp4]/b\(heightConstraint)/best"
        }
    }

    func buildFormatStringFromID(_ formatID: String) -> String {
        return "\(formatID)+ba[ext=m4a]/\(formatID)+ba/\(formatID)"
    }

    func fetchFormatsLocally(for item: DownloadItem) {
        DispatchQueue.main.async {
            self.objectWillChange.send()
            item.formatsState = .loading
        }
        
        guard let ytdlpPath = getExecutablePath(name: "yt-dlp") else {
            DispatchQueue.main.async {
                self.ytdlpMissing = true
                item.formatsState = .failed
            }
            return
        }
        
        Task {
            let process = Process()
            process.executableURL = URL(fileURLWithPath: ytdlpPath)
            var args = ["--js-runtimes", "node", "-j", "--no-playlist", "--skip-download"]
            if let browserValue = self.cookieBrowser.ytdlpValue {
                args.append(contentsOf: ["--cookies-from-browser", browserValue])
            }
            args.append(item.url)
            process.arguments = args
            
            let pipe = Pipe()
            process.standardOutput = pipe
            let errorPipe = Pipe()
            process.standardError = errorPipe
            
            var stdoutData = Data()
            var stderrData = Data()
            
            let stdoutLock = NSLock()
            let stderrLock = NSLock()
            
            pipe.fileHandleForReading.readabilityHandler = { fileHandle in
                let data = fileHandle.availableData
                if !data.isEmpty {
                    stdoutLock.lock()
                    stdoutData.append(data)
                    stdoutLock.unlock()
                }
            }
            
            errorPipe.fileHandleForReading.readabilityHandler = { fileHandle in
                let data = fileHandle.availableData
                if !data.isEmpty {
                    stderrLock.lock()
                    stderrData.append(data)
                    stderrLock.unlock()
                }
            }
            
            do {
                try process.run()
                
                let exitStatus = await withCheckedContinuation { continuation in
                    process.terminationHandler = { p in
                        pipe.fileHandleForReading.readabilityHandler = nil
                        errorPipe.fileHandleForReading.readabilityHandler = nil
                        continuation.resume(returning: p.terminationStatus)
                    }
                }
                
                if exitStatus == 0 {
                    stdoutLock.lock()
                    let data = stdoutData
                    stdoutLock.unlock()
                    
                    if let jsonObject = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                        let title = jsonObject["title"] as? String ?? ""
                        
                        var videoFormats: [AvailableFormat] = []
                        if let formatsArray = jsonObject["formats"] as? [[String: Any]] {
                            for f in formatsArray {
                                let height = f["height"] as? Int ?? 0
                                let vcodec = f["vcodec"] as? String ?? "none"
                                if height < 144 || vcodec == "none" {
                                    continue
                                }
                                
                                let fps = (f["fps"] as? Double) ?? ((f["fps"] as? Int).map(Double.init) ?? 30.0)
                                let dr = f["dynamic_range"] as? String
                                let filesize = (f["filesize"] as? Int64) ?? (f["filesize_approx"] as? Int64)
                                
                                let formatID = f["format_id"] as? String ?? ""
                                if !formatID.isEmpty {
                                    videoFormats.append(AvailableFormat(
                                        id: formatID,
                                        height: height,
                                        fps: fps,
                                        vcodec: vcodec,
                                        filesize: filesize,
                                        dynamicRange: dr
                                    ))
                                }
                            }
                        }
                        
                        videoFormats.sort(by: {
                            if $0.height != $1.height {
                                return $0.height > $1.height
                            }
                            return $0.fps > $1.fps
                        })
                        
                        await MainActor.run {
                            self.objectWillChange.send()
                            if !title.isEmpty { item.title = title }
                            item.formatsState = .loaded(videoFormats)
                            
                            let preferred = videoFormats.first {
                                item.customCodec.matches(vcodec: $0.vcodec) &&
                                (item.customHDR == .any || (item.customHDR == .hdr && $0.isHDR) || (item.customHDR == .sdr && !$0.isHDR))
                            }
                            item.selectedFormatID = (preferred ?? videoFormats.first)?.id
                        }
                    } else {
                        await MainActor.run {
                            item.formatsState = .failed
                        }
                    }
                } else {
                    stderrLock.lock()
                    let errData = stderrData
                    stderrLock.unlock()
                    let errMsg = String(data: errData, encoding: .utf8) ?? "Unknown error"
                    print("yt-dlp error: \(errMsg)")
                    await MainActor.run {
                        item.formatsState = .failed
                    }
                }
            } catch {
                await MainActor.run {
                    item.formatsState = .failed
                }
            }
        }
    }

    private func startLocal(item: DownloadItem) async {
        await MainActor.run {
            self.objectWillChange.send()
            item.status = .downloading
            item.progress = 0.0
            item.progressText = "Iniciando descarga local..."
        }
        
        guard let ytdlpPath = getExecutablePath(name: "yt-dlp") else {
            await MainActor.run {
                self.ytdlpMissing = true
                item.status = .failed("No se encontró 'yt-dlp' en tu Mac. Instálalo con 'brew install yt-dlp'.")
            }
            return
        }
        
        let ffmpegPath = getExecutablePath(name: "ffmpeg")
        
        let tempDir = FileManager.default.temporaryDirectory.appendingPathComponent(UUID().uuidString)
        do {
            try FileManager.default.createDirectory(at: tempDir, withIntermediateDirectories: true)
        } catch {
            await MainActor.run {
                item.status = .failed("No se pudo crear el directorio temporal: \(error.localizedDescription)")
            }
            return
        }
        
        let outputTemplate = tempDir.appendingPathComponent("%(title)s.%(ext)s").path
        
        var args: [String] = ["--js-runtimes", "node", "--newline", "-o", outputTemplate]
        
        if let browserValue = self.cookieBrowser.ytdlpValue {
            args.append(contentsOf: ["--cookies-from-browser", browserValue])
        }
        
        if let ffmpeg = ffmpegPath {
            let ffmpegDir = URL(fileURLWithPath: ffmpeg).deletingLastPathComponent().path
            args.append(contentsOf: ["--ffmpeg-location", ffmpegDir])
        }
        
        if item.format == .audioMP3 {
            args.append(contentsOf: ["-x", "--audio-format", "mp3"])
        } else {
            let quality = item.isCustomized ? item.customQuality.rawValue : self.globalQuality.rawValue
            let codec = item.isCustomized ? item.customCodec.rawValue : self.globalCodec.rawValue
            let hdr = item.isCustomized ? item.customHDR.rawValue : self.globalHDR.rawValue
            
            let fmtString: String
            if let selectedID = item.selectedFormatID, item.isCustomized {
                fmtString = buildFormatStringFromID(selectedID)
            } else {
                fmtString = buildFormatString(quality: quality, codec: codec, hdr: hdr)
            }
            args.append(contentsOf: ["-f", fmtString, "--merge-output-format", "mp4"])
        }
        
        args.append(item.url)
        
        let process = Process()
        process.executableURL = URL(fileURLWithPath: ytdlpPath)
        process.arguments = args
        
        await MainActor.run {
            item.localProcess = process
        }
        
        let outputPipe = Pipe()
        process.standardOutput = outputPipe
        process.standardError = outputPipe
        
        let handle = outputPipe.fileHandleForReading
        
        let progressRegex = try? NSRegularExpression(pattern: #"\[download\]\s+(\d+\.\d+)%"#, options: [])
        
        handle.readabilityHandler = { [weak item] fileHandle in
            let data = fileHandle.availableData
            guard !data.isEmpty else { return }
            if let text = String(data: data, encoding: .utf8) {
                let lines = text.components(separatedBy: .newlines)
                for line in lines {
                    guard !line.isEmpty else { continue }
                    
                    let nsRange = NSRange(line.startIndex..<line.endIndex, in: line)
                    if let match = progressRegex?.firstMatch(in: line, options: [], range: nsRange),
                       let range = Range(match.range(at: 1), in: line),
                       let progressFloat = Float(line[range]) {
                        
                        let percentage = Double(progressFloat) / 100.0
                        
                        DispatchQueue.main.async {
                            item?.progress = percentage
                            item?.progressText = line
                        }
                    } else {
                        if line.contains("Destination: ") {
                            let parts = line.components(separatedBy: "Destination: ")
                            if parts.count > 1 {
                                let filename = URL(fileURLWithPath: parts[1]).lastPathComponent
                                DispatchQueue.main.async {
                                    if item?.title == item?.url {
                                        item?.title = filename
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
        
        do {
            try process.run()
            
            let exitStatus = await withCheckedContinuation { continuation in
                process.terminationHandler = { p in
                    handle.readabilityHandler = nil
                    continuation.resume(returning: p.terminationStatus)
                }
            }
            
            await MainActor.run {
                item.localProcess = nil
            }
            
            if exitStatus == 0 {
                let fileManager = FileManager.default
                var movedFiles: [URL] = []
                
                if let files = try? fileManager.contentsOfDirectory(at: tempDir, includingPropertiesForKeys: nil) {
                    let finalFiles = files.filter { !$0.pathExtension.hasPrefix("part") && !$0.pathExtension.hasPrefix("ytdl") }
                    
                    for srcURL in finalFiles {
                        let baseName = srcURL.deletingPathExtension().lastPathComponent
                        let ext = srcURL.pathExtension
                        
                        var destURL = outputDirectory.appendingPathComponent("\(baseName).\(ext)")
                        
                        var counter = 1
                        while fileManager.fileExists(atPath: destURL.path) {
                            destURL = outputDirectory.appendingPathComponent("\(baseName) (\(counter)).\(ext)")
                            counter += 1
                        }
                        
                        do {
                            try fileManager.moveItem(at: srcURL, to: destURL)
                            movedFiles.append(destURL)
                        } catch {
                            print("Error al mover el archivo \(srcURL.lastPathComponent): \(error)")
                        }
                    }
                }
                
                if !movedFiles.isEmpty {
                    await MainActor.run {
                        item.outputPath = movedFiles.first
                        item.status = .done
                        item.progress = 1.0
                        item.progressText = movedFiles.count > 1 ? "Completado (\(movedFiles.count) archivos)" : "Completado"
                    }
                } else {
                    await MainActor.run {
                        item.status = .failed("No se encontraron archivos descargados en la carpeta temporal.")
                    }
                }
            } else {
                await MainActor.run {
                    if case .cancelled = item.status {
                        // Mantener cancelado
                    } else {
                        item.status = .failed("yt-dlp falló con código \(exitStatus)")
                    }
                }
            }
        } catch {
            await MainActor.run {
                item.localProcess = nil
                item.status = .failed("Error al ejecutar el proceso: \(error.localizedDescription)")
            }
        }
        
        try? FileManager.default.removeItem(at: tempDir)
    }
}
