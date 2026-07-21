import Foundation

struct DownloadProgress: Decodable {
    let status: String
    let progress: Double
    let progress_text: String
    let title: String?
}

class SSEClient: ObservableObject {
    private var task: URLSessionDataTask?
    
    private let baseURL: String = {
        Bundle.main.object(forInfoDictionaryKey: "API_BASE_URL") as? String
        ?? "http://localhost:8000/api/v1"
    }()

    func connect(jobId: String, token: String, onEvent: @escaping (DownloadProgress?, String?) -> Void) {
        guard let url = URL(string: "\(baseURL)/downloads/\(jobId)/stream") else { return }
        var request = URLRequest(url: url)
        request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        request.setValue("text/event-stream", forHTTPHeaderField: "Accept")
        
        let session = URLSession(configuration: .default)
        task = session.dataTask(with: request) { data, response, error in
            guard let data = data, let text = String(data: data, encoding: .utf8) else {
                onEvent(nil, "error")
                return
            }
            
            let lines = text.components(separatedBy: "\n")
            var currentEvent: String?
            var currentData: String?
            
            for line in lines {
                if line.hasPrefix("event: ") {
                    currentEvent = String(line.dropFirst(7)).trimmingCharacters(in: .whitespacesAndNewlines)
                } else if line.hasPrefix("data: ") {
                    currentData = String(line.dropFirst(6)).trimmingCharacters(in: .whitespacesAndNewlines)
                    
                    if let ev = currentEvent, let dt = currentData {
                        if ev == "progress", let jsonData = dt.data(using: .utf8) {
                            let prog = try? JSONDecoder().decode(DownloadProgress.self, from: jsonData)
                            onEvent(prog, ev)
                        } else if ev == "done" || ev == "error" {
                            onEvent(nil, ev)
                        }
                    }
                    currentEvent = nil
                    currentData = nil
                }
            }
        }
        task?.resume()
    }

    func disconnect() {
        task?.cancel()
    }
}
