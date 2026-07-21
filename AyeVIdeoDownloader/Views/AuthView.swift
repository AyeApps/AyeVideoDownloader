import SwiftUI

struct AuthView: View {
    @Bindable var viewModel: AuthViewModel
    
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "cloud.fill")
                .font(.system(size: 64))
                .foregroundColor(.blue)
            
            Text("AyeVideoDownloader Cloud")
                .font(.title)
                .fontWeight(.bold)
            
            VStack(spacing: 12) {
                TextField("Email", text: $viewModel.email)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .frame(width: 300)
                
                SecureField("Contraseña", text: $viewModel.password)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .frame(width: 300)
                
                if let error = viewModel.errorMessage {
                    Text(error)
                        .foregroundColor(.red)
                        .font(.caption)
                        .multilineTextAlignment(.center)
                        .frame(width: 300)
                }
                
                Button(action: {
                    Task {
                        await viewModel.login()
                    }
                }) {
                    if viewModel.isLoading {
                        ProgressView()
                            .scaleEffect(0.5)
                            .frame(maxWidth: .infinity)
                    } else {
                        Text("Iniciar Sesión")
                            .frame(maxWidth: .infinity)
                    }
                }
                .buttonStyle(.borderedProminent)
                .frame(width: 300)
                .disabled(viewModel.isLoading || viewModel.email.isEmpty || viewModel.password.isEmpty)
            }
        }
        .padding(40)
        .frame(minWidth: 400, minHeight: 300)
    }
}
