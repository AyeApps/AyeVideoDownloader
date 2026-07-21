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
    
    func logout() async {
        await KeychainService.shared.clearTokens()
        await MainActor.run { isAuthenticated = false }
    }
}
