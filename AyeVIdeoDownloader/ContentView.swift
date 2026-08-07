import SwiftUI

struct ContentView: View {
    @State private var authViewModel = AuthViewModel()
    @StateObject private var manager = DownloadManager()
    
    var body: some View {
        Group {
            if manager.processingMode == .local || authViewModel.isAuthenticated {
                MainAppView(manager: manager, authViewModel: authViewModel)
            } else {
                AuthView(viewModel: authViewModel, manager: manager)
            }
        }
    }
}

struct MainAppView: View {
    @ObservedObject var manager: DownloadManager
    var authViewModel: AuthViewModel
    
    var body: some View {
        VStack(spacing: 0) {
            HStack(spacing: 12) {
                Picker("Modo:", selection: $manager.processingMode) {
                    ForEach(ProcessingMode.allCases) { mode in
                        Text(mode.rawValue).tag(mode)
                    }
                }
                .pickerStyle(.segmented)
                .frame(width: 180)
                .padding(.leading)
                
                Spacer()
                
                if manager.processingMode == .cloud {
                    Button("Cerrar Sesión") {
                        Task {
                            await authViewModel.logout()
                        }
                    }
                    .padding()
                } else {
                    HStack(spacing: 6) {
                        Image(systemName: "laptopcomputer")
                            .font(.caption)
                            .foregroundStyle(.green)
                        Text("Procesando en local")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                    .padding()
                }
            }
            
            AddDownloadBar(manager: manager)

            Divider()

            if manager.items.isEmpty {
                emptyState
            } else {
                List {
                    ForEach(manager.items) { item in
                        DownloadRowView(item: item, manager: manager)
                    }
                }
                .listStyle(.inset)

                if hasWaiting {
                    Divider()
                    HStack {
                        Text("\(waitingCount) en espera")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        Spacer()
                        Button {
                            manager.fetchAllFormats()
                        } label: {
                            Label("Detectar formatos", systemImage: "gearshape")
                        }
                        .buttonStyle(.bordered)
                        
                        Button {
                            manager.startAll()
                        } label: {
                            Label("Empezar descargas", systemImage: "play.fill")
                        }
                        .buttonStyle(.borderedProminent)
                        .keyboardShortcut(.return, modifiers: .command)
                    }
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                }
            }

            Divider()

            outputDirectoryBar
        }
        .frame(minWidth: 640, minHeight: 400)
    }

    private var waitingCount: Int {
        manager.items.filter { if case .waiting = $0.status { return true }; return false }.count
    }

    private var hasWaiting: Bool { waitingCount > 0 }

    private var emptyState: some View {
        VStack(spacing: 12) {
            Image(systemName: "arrow.down.circle.dotted")
                .font(.system(size: 48))
                .foregroundStyle(.tertiary)
            Text("Pega una URL para empezar")
                .foregroundStyle(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }

    private var outputDirectoryBar: some View {
        HStack(spacing: 8) {
            Image(systemName: "folder")
                .foregroundStyle(.secondary)
            Text(manager.outputDirectory.path)
                .font(.caption)
                .foregroundStyle(.secondary)
                .lineLimit(1)
                .truncationMode(.middle)
            Spacer()
            Button("Cambiar") {
                manager.chooseOutputDirectory()
            }
            .buttonStyle(.borderless)
            .font(.caption)
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 8)
        .background(.regularMaterial)
    }
}

#Preview {
    ContentView()
}
