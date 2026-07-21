import Foundation
import Security

actor KeychainService {
    static let shared = KeychainService()
    
    private let service = "com.ayeapps.ayevideodownloader"
    
    enum TokenKey: String {
        case accessToken
        case refreshToken
    }
    
    func saveTokens(access: String, refresh: String) throws {
        try save(access, for: .accessToken)
        try save(refresh, for: .refreshToken)
    }
    
    func getToken(_ key: TokenKey) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key.rawValue,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]
        
        var dataTypeRef: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &dataTypeRef)
        
        if status == errSecSuccess, let data = dataTypeRef as? Data {
            return String(data: data, encoding: .utf8)
        }
        return nil
    }
    
    func clearTokens() {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service
        ]
        SecItemDelete(query as CFDictionary)
    }
    
    private func save(_ value: String, for key: TokenKey) throws {
        let data = value.data(using: .utf8)!
        
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: key.rawValue
        ]
        
        let attributes: [String: Any] = [
            kSecValueData as String: data
        ]
        
        var status = SecItemUpdate(query as CFDictionary, attributes as CFDictionary)
        
        if status == errSecItemNotFound {
            var newItem = query
            newItem[kSecValueData as String] = data
            status = SecItemAdd(newItem as CFDictionary, nil)
        }
        
        if status != errSecSuccess {
            throw NSError(domain: "KeychainError", code: Int(status), userInfo: nil)
        }
    }
}
