import Foundation
import Combine

// MARK: - Enums

enum DownloadFormat: String, CaseIterable, Identifiable {
    case videoMP4 = "Video (MP4)"
    case audioMP3 = "Solo Audio (MP3)"
    var id: String { rawValue }
}

enum VideoQuality: String, CaseIterable, Identifiable {
    case best  = "Mejor"
    case q2160 = "4K"
    case q1440 = "1440p"
    case q1080 = "1080p"
    case q720  = "720p"
    case q480  = "480p"
    case q360  = "360p"
    var id: String { rawValue }
    
    var description: String {
        switch self {
        case .best:  return "Recomendado"
        case .q2160: return "Ultra HD"
        case .q1440: return "Quad HD"
        case .q1080: return "Full HD"
        case .q720:  return "HD"
        case .q480:  return "SD"
        case .q360:  return "Baja"
        }
    }

    var heightConstraint: String {
        switch self {
        case .best:  return ""
        case .q2160: return "[height<=2160]"
        case .q1440: return "[height<=1440]"
        case .q1080: return "[height<=1080]"
        case .q720:  return "[height<=720]"
        case .q480:  return "[height<=480]"
        case .q360:  return "[height<=360]"
        }
    }
}

enum VideoCodec: String, CaseIterable, Identifiable {
    case any  = "Cualquiera"
    case h264 = "H.264"
    case h265 = "H.265"
    case vp9  = "VP9"
    case av1  = "AV1"
    var id: String { rawValue }
    
    var description: String {
        switch self {
        case .any:  return "Automático"
        case .h264: return "Nativo Mac (Universal)"
        case .h265: return "Nativo Mac (Poco peso)"
        case .vp9:  return "Requiere IINA (Recomendado YT)"
        case .av1:  return "Requiere IINA (Máxima calidad)"
        }
    }

    var codecConstraint: String {
        switch self {
        case .any:  return ""
        case .h264: return "[vcodec~='^avc']"
        case .h265: return "[vcodec~='^(hev|hvc)']"
        case .vp9:  return "[vcodec~='^vp0?9']"
        case .av1:  return "[vcodec~='^av01']"
        }
    }

    func matches(vcodec: String) -> Bool {
        switch self {
        case .any:  return true
        case .h264: return vcodec.hasPrefix("avc")
        case .h265: return vcodec.hasPrefix("hev") || vcodec.hasPrefix("hvc")
        case .vp9:  return vcodec.hasPrefix("vp09") || vcodec.hasPrefix("vp9")
        case .av1:  return vcodec.hasPrefix("av01")
        }
    }

    var color: String {
        switch self {
        case .any:  return "secondary"
        case .h264: return "blue"
        case .h265: return "purple"
        case .vp9:  return "green"
        case .av1:  return "orange"
        }
    }
}

enum DynamicRangePreference: String, CaseIterable, Identifiable {
    case any = "Cualquiera"
    case sdr = "SDR"
    case hdr = "HDR"
    var id: String { rawValue }
    
    var description: String {
        switch self {
        case .any: return "Automático"
        case .sdr: return "Colores normales"
        case .hdr: return "Colores vivos"
        }
    }

    var constraint: String {
        switch self {
        case .any: return ""
        case .sdr: return "[dynamic_range=SDR]"
        case .hdr: return "[dynamic_range!=SDR]"
        }
    }
}

enum CookieBrowser: String, CaseIterable, Identifiable {
    case none    = "Sin cookies"
    case chrome  = "Chrome"
    case firefox = "Firefox"
    case safari  = "Safari"
    case brave   = "Brave"
    case edge    = "Edge"
    var id: String { rawValue }
    var ytdlpValue: String? { self == .none ? nil : rawValue.lowercased() }
}

enum DownloadStatus {
    case waiting, downloading, done, failed(String), cancelled
}

enum FormatsState {
    case idle, loading, loaded([AvailableFormat]), failed
}

// MARK: - AvailableFormat

struct AvailableFormat: Identifiable, Hashable {
    let id: String
    let height: Int
    let fps: Double
    let vcodec: String
    let filesize: Int64?
    let dynamicRange: String?

    var heightLabel: String {
        switch height {
        case 2160...: return "4K"
        case 1440...: return "1440p"
        default:      return "\(height)p"
        }
    }
    
    var heightDescription: String {
        switch height {
        case 2160...: return "Ultra HD"
        case 1440...: return "Quad HD"
        case 1080...: return "Full HD"
        case 720...:  return "HD"
        case 480...:  return "SD"
        case 360...:  return "Baja"
        default:      return ""
        }
    }
    
    var fpsLabel: String  { fps > 31 ? " \(Int(fps))fps" : "" }
    
    var codecLabel: String {
        if vcodec.hasPrefix("avc")                              { return "H.264" }
        if vcodec.hasPrefix("hev") || vcodec.hasPrefix("hvc")  { return "H.265" }
        if vcodec.hasPrefix("vp09") || vcodec.hasPrefix("vp9") { return "VP9"   }
        if vcodec.hasPrefix("av01")                             { return "AV1"   }
        return vcodec.components(separatedBy: ".").first ?? vcodec
    }
    
    var codecDescription: String {
        if vcodec.hasPrefix("avc")                              { return "Nativo Mac - Universal" }
        if vcodec.hasPrefix("hev") || vcodec.hasPrefix("hvc")  { return "Nativo Mac - Poco peso" }
        if vcodec.hasPrefix("vp09") || vcodec.hasPrefix("vp9") { return "Requiere IINA - Recomendado YT" }
        if vcodec.hasPrefix("av01")                             { return "Requiere IINA - Máxima calidad"  }
        return ""
    }
    
    var isHDR: Bool { dynamicRange != nil && dynamicRange != "SDR" }
    
    var displayLabel: String {
        let hdDesc = heightDescription.isEmpty ? "" : " (\(heightDescription))"
        let cdDesc = codecDescription.isEmpty ? "" : " (\(codecDescription))"
        return "\(heightLabel)\(hdDesc)\(fpsLabel) · \(codecLabel)\(cdDesc)\(isHDR ? " · HDR (Colores vivos)" : "")"
    }
    var sizeLabel: String {
        guard let bytes = filesize else { return "" }
        let mb = Double(bytes) / 1_048_576
        return mb >= 1000 ? String(format: "  %.1f GB", mb/1024) : String(format: "  %.0f MB", mb)
    }
}

// MARK: - DownloadItem

class DownloadItem: ObservableObject, Identifiable {
    let id = UUID()
    let url: String
    var format: DownloadFormat

    @Published var title: String
    @Published var status: DownloadStatus = .waiting
    @Published var progress: Double = 0.0
    @Published var progressText: String = ""
    @Published var outputPath: URL?
    
    var jobId: String?
    var sseClient: SSEClient?
    var localProcess: Process?
    
    var estimatedBytesHistory: [Double] = []

    // Per-video customization
    @Published var isCustomized = false
    @Published var customQuality: VideoQuality = .best
    @Published var customCodec: VideoCodec = .any
    @Published var customHDR: DynamicRangePreference = .any
    @Published var formatsState: FormatsState = .idle
    @Published var selectedFormatID: String? = nil

    var thumbnailURL: URL? {
        guard let components = URLComponents(string: url) else { return nil }
        var videoID: String?
        if let host = components.host {
            if host.contains("youtu.be") {
                videoID = components.path.trimmingCharacters(in: CharacterSet(charactersIn: "/"))
            } else if host.contains("youtube.com") {
                if components.path.contains("/shorts/") || components.path.contains("/live/") {
                    videoID = components.path.components(separatedBy: "/").last
                } else {
                    videoID = components.queryItems?.first(where: { $0.name == "v" })?.value
                }
            }
        }
        guard let id = videoID, !id.isEmpty else { return nil }
        return URL(string: "https://img.youtube.com/vi/\(id)/mqdefault.jpg")
    }

    init(url: String, format: DownloadFormat) {
        self.url = url
        self.format = format
        self.title = url
    }
}
