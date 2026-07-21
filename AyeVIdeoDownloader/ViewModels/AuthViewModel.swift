import Foundation
import Observation

struct AuthResponse: Decodable {
    let accessToken: String
    let refreshToken: String
}

@Observable
class AuthViewModel {
    var email = ""
    var password = ""
    var isLoading = false
    var errorMessage: String?
    var isAuthenticated = false
    
    init() {
        Task {
            if await KeychainService.shared.getToken(.accessToken) != nil {
                await MainActor.run { isAuthenticated = true }
            }
        }
    }

    func login() async {
        await MainActor.run {
            isLoading = true
            errorMessage = nil
        }
        
        defer {
            Task { @MainActor in isLoading = false }
        }
        
        do {
            let body = ["email": email, "password": password]
            let response: AuthResponse = try await NetworkService.shared.request(
                "/auth/login",
                method: "POST",
                body: body,
                requiresAuth: false
            )
            
            try await KeychainService.shared.saveTokens(
                access: response.accessToken,
                refresh: response.refreshToken
            )
            
            await MainActor.run { isAuthenticated = true }
        } catch {
            await MainActor.run { errorMessage = error.localizedDescription }
        }
    }
    
    func register() async {
        await MainActor.run {
            isLoading = true
            errorMessage = nil
        }
        
        defer {
            Task { @MainActor in isLoading = false }
        }
        
        do {
            let body = ["email": email, "password": password]
            // Registra al usuario
            let _: [String: String] = try await NetworkService.shared.request(
                "/auth/register",
                method: "POST",
                body: body,
                requiresAuth: false
            )
            
            // Si el registro es exitoso, hace login automáticamente
            let response: AuthResponse = try await NetworkService.shared.request(
                "/auth/login",
                method: "POST",
                body: body,
                requiresAuth: false
            )
            
            try await KeychainService.shared.saveTokens(
                access: response.accessToken,
                refresh: response.refreshToken
            )
            
            await MainActor.run { isAuthenticated = true }
        } catch {
            await MainActor.run { errorMessage = error.localizedDescription }
        }
    }
    
    func logout() async {
        await KeychainService.shared.clearTokens()
        await MainActor.run { isAuthenticated = false }
    }
}
