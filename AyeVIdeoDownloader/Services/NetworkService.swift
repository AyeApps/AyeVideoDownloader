import Foundation

enum APIError: LocalizedError {
    case unauthorized
    case notFound
    case serverError(Int, String)
    case decodingError(Error)
    case networkError(Error)
    case jobExpired
    
    var errorDescription: String? {
        switch self {
        case .unauthorized: return "No autorizado. Inicie sesión nuevamente."
        case .notFound: return "Recurso no encontrado."
        case .serverError(let code, let msg): return "Error del servidor (\(code)): \(msg)"
        case .decodingError(let err): return "Error decodificando respuesta: \(err.localizedDescription)"
        case .networkError(let err): return "Error de red: \(err.localizedDescription)"
        case .jobExpired: return "El archivo de la descarga ha expirado en el servidor."
        }
    }
}

actor NetworkService {
    static let shared = NetworkService()
    
    private let baseURL: String = {
        if let custom = Bundle.main.object(forInfoDictionaryKey: "API_BASE_URL") as? String, !custom.isEmpty {
            return custom
        }
        if let envUrl = ProcessInfo.processInfo.environment["API_BASE_URL"], !envUrl.isEmpty {
            return envUrl
        }
        #if DEBUG
        return "http://localhost:8002/api/v1"
        #else
        return "https://api-ayvddw.ayeapps.com/api/v1"
        #endif
    }()

    private let authBaseURL: String = {
        if let custom = Bundle.main.object(forInfoDictionaryKey: "AUTH_API_URL") as? String, !custom.isEmpty {
            return custom
        }
        if let envUrl = ProcessInfo.processInfo.environment["AUTH_API_URL"], !envUrl.isEmpty {
            return envUrl
        }
        #if DEBUG
        return "http://localhost:8000/api/v1"
        #else
        return "https://api-auth.ayeapps.com/api/v1"
        #endif
    }()
    
    private init() {}
    
    func request<T: Decodable>(
        _ endpoint: String,
        method: String = "GET",
        body: Encodable? = nil,
        requiresAuth: Bool = true
    ) async throws -> T {
        let (data, _) = try await rawRequest(endpoint, method: method, body: body, requiresAuth: requiresAuth)
        do {
            let decoder = JSONDecoder()
            decoder.keyDecodingStrategy = .convertFromSnakeCase
            return try decoder.decode(T.self, from: data)
        } catch {
            throw APIError.decodingError(error)
        }
    }
    
    func rawRequest(
        _ endpoint: String,
        method: String = "GET",
        body: Encodable? = nil,
        requiresAuth: Bool = true
    ) async throws -> (Data, HTTPURLResponse) {
        let targetBase = endpoint.hasPrefix("/auth") ? authBaseURL : baseURL
        guard let url = URL(string: targetBase + endpoint) else {
            throw URLError(.badURL)
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        
        if let body = body {
            request.httpBody = try? JSONEncoder().encode(body)
        }
        
        if requiresAuth {
            if let token = await KeychainService.shared.getToken(.accessToken) {
                request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            } else {
                throw APIError.unauthorized
            }
        }
        
        let (data, response): (Data, URLResponse)
        do {
            (data, response) = try await URLSession.shared.data(for: request)
        } catch {
            throw APIError.networkError(error)
        }
        
        guard let httpResponse = response as? HTTPURLResponse else {
            throw URLError(.badServerResponse)
        }
        
        switch httpResponse.statusCode {
        case 200...299:
            return (data, httpResponse)
        case 401:
            throw APIError.unauthorized
        case 404:
            throw APIError.notFound
        case 410:
            throw APIError.jobExpired
        default:
            let msg = String(data: data, encoding: .utf8) ?? "Unknown error"
            throw APIError.serverError(httpResponse.statusCode, msg)
        }
    }
    
    func downloadData(_ endpoint: String) async throws -> Data {
        let (data, _) = try await rawRequest(endpoint, method: "GET", requiresAuth: true)
        return data
    }
}
