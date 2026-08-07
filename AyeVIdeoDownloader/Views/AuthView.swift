import SwiftUI

struct AuthView: View {
    @Bindable var viewModel: AuthViewModel
    @ObservedObject var manager: DownloadManager
    
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: manager.processingMode == .cloud ? "cloud.fill" : "laptopcomputer")
                .font(.system(size: 64))
                .foregroundColor(manager.processingMode == .cloud ? .blue : .green)
            
            Picker("Modo de Procesamiento", selection: $manager.processingMode) {
                ForEach(ProcessingMode.allCases) { mode in
                    Text(mode.rawValue).tag(mode)
                }
            }
            .pickerStyle(.segmented)
            .frame(width: 250)
            
            if manager.processingMode == .cloud {
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
                    
                    HStack {
                        Button(action: {
                            Task {
                                await viewModel.login()
                            }
                        }) {
                            if viewModel.isLoading {
                                ProgressView().scaleEffect(0.5).frame(maxWidth: .infinity)
                            } else {
                                Text("Iniciar Sesión").frame(maxWidth: .infinity)
                            }
                        }
                        .buttonStyle(.borderedProminent)
                        
                        Button(action: {
                            Task {
                                await viewModel.register()
                            }
                        }) {
                            if viewModel.isLoading {
                                ProgressView().scaleEffect(0.5).frame(maxWidth: .infinity)
                            } else {
                                Text("Crear cuenta").frame(maxWidth: .infinity)
                            }
                        }
                        .buttonStyle(.bordered)
                    }
                    .frame(width: 300)
                    .disabled(viewModel.isLoading || viewModel.email.isEmpty || viewModel.password.isEmpty)
                }
            } else {
                VStack(spacing: 16) {
                    Text("AyeVideoDownloader Local")
                        .font(.title)
                        .fontWeight(.bold)
                    
                    Text("Procesa descargas de forma 100% privada usando yt-dlp y ffmpeg directamente en tu Mac.")
                        .font(.body)
                        .foregroundColor(.secondary)
                        .multilineTextAlignment(.center)
                        .frame(width: 300)
                    
                    Button(action: {
                        manager.processingMode = .local
                    }) {
                        Text("Comenzar a usar localmente")
                            .frame(maxWidth: .infinity)
                    }
                    .buttonStyle(.borderedProminent)
                    .controlSize(.large)
                    .frame(width: 300)
                    .padding(.top, 10)
                }
            }
        }
        .padding(40)
        .frame(minWidth: 400, minHeight: 380)
    }
}
