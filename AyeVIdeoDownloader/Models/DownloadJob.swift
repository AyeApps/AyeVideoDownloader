import Foundation

struct CreateDownloadRequest: Encodable {
    let url: String
    let format: String
    let quality: String?
    let codec: String?
    let hdr: String?
    let selected_format_id: String?
}

struct DownloadJobResponse: Decodable {
    let job_id: String
    let status: String
    let progress: Double
    let progress_text: String
    let title: String?
    let thumbnail_url: String?
    let file_size: Int?
    let file_name: String?
    let created_at: String
    let expires_at: String?
}
