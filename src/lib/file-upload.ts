import { NextRequest } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { existsSync } from 'fs'
import path from 'path'
import { z } from 'zod'

// File validation schema
const fileValidationSchema = z.object({
  name: z.string().min(1, 'File name is required'),
  size: z.number().max(5 * 1024 * 1024, 'File size must be less than 5MB'),
  type: z.string().refine(
    (type) => type === 'application/pdf',
    'Only PDF files are allowed'
  )
})

// Allowed file types
const ALLOWED_FILE_TYPES = {
  'application/pdf': '.pdf'
}

// Maximum file size (5MB)
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Upload directories
const UPLOAD_DIRS = {
  surat_permohonan: 'uploads/surat-permohonan',
  bukti_transfer: 'uploads/bukti-transfer',
  sip: 'uploads/sip'
}

export interface FileUploadResult {
  success: boolean
  message: string
  filePath?: string
  fileName?: string
}

export class FileUploadService {
  /**
   * Validate uploaded file
   */
  static validateFile(file: File): { isValid: boolean; error?: string } {
    try {
      fileValidationSchema.parse({
        name: file.name,
        size: file.size,
        type: file.type
      })
      return { isValid: true }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return {
          isValid: false,
          error: error.issues.map(issue => issue.message).join(', ')
        }
      }
      return {
        isValid: false,
        error: 'File validation failed'
      }
    }
  }

  /**
   * Generate unique filename
   */
  static generateFileName(originalName: string, prefix?: string): string {
    const timestamp = Date.now()
    const randomString = Math.random().toString(36).substring(2, 15)
    const extension = path.extname(originalName)
    const baseName = path.basename(originalName, extension)
    
    return `${prefix ? prefix + '_' : ''}${baseName}_${timestamp}_${randomString}${extension}`
  }

  /**
   * Ensure upload directory exists
   */
  static async ensureUploadDir(uploadType: keyof typeof UPLOAD_DIRS): Promise<void> {
    const uploadDir = UPLOAD_DIRS[uploadType]
    const fullPath = path.join(process.cwd(), 'public', uploadDir)
    
    if (!existsSync(fullPath)) {
      await mkdir(fullPath, { recursive: true })
    }
  }

  /**
   * Upload file to server
   */
  static async uploadFile(
    file: File,
    uploadType: keyof typeof UPLOAD_DIRS,
    prefix?: string
  ): Promise<FileUploadResult> {
    try {
      // Validate file
      const validation = this.validateFile(file)
      if (!validation.isValid) {
        return {
          success: false,
          message: validation.error || 'File validation failed'
        }
      }

      // Ensure upload directory exists
      await this.ensureUploadDir(uploadType)

      // Generate unique filename
      const fileName = this.generateFileName(file.name, prefix)
      const uploadDir = UPLOAD_DIRS[uploadType]
      const filePath = path.join(uploadDir, fileName)
      const fullPath = path.join(process.cwd(), 'public', filePath)

      // Convert file to buffer and save
      const bytes = await file.arrayBuffer()
      const buffer = Buffer.from(bytes)
      await writeFile(fullPath, buffer)

      return {
        success: true,
        message: 'File uploaded successfully',
        filePath: `/${filePath}`,
        fileName
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      return {
        success: false,
        message: 'Failed to upload file'
      }
    }
  }

  /**
   * Parse multipart form data from request
   */
  static async parseFormData(request: NextRequest): Promise<{
    fields: Record<string, string>
    files: Record<string, File>
  }> {
    try {
      const formData = await request.formData()
      const fields: Record<string, string> = {}
      const files: Record<string, File> = {}

      for (const [key, value] of formData.entries()) {
        if (value instanceof File) {
          files[key] = value
        } else {
          fields[key] = value as string
        }
      }

      return { fields, files }
    } catch (error) {
      console.error('Error parsing form data:', error)
      throw new Error('Failed to parse form data')
    }
  }

  /**
   * Get file URL for serving
   */
  static getFileUrl(filePath: string): string {
    // Remove leading slash if present
    const cleanPath = filePath.startsWith('/') ? filePath.substring(1) : filePath
    return `/${cleanPath}`
  }

  /**
   * Check if file exists
   */
  static fileExists(filePath: string): boolean {
    try {
      const fullPath = path.join(process.cwd(), 'public', filePath)
      return existsSync(fullPath)
    } catch {
      return false
    }
  }

  /**
   * Delete file from server
   */
  static async deleteFile(filePath: string): Promise<boolean> {
    try {
      const { unlink } = await import('fs/promises')
      const fullPath = path.join(process.cwd(), 'public', filePath)
      
      if (existsSync(fullPath)) {
        await unlink(fullPath)
        return true
      }
      return false
    } catch (error) {
      console.error('Error deleting file:', error)
      return false
    }
  }
}

// Utility functions for specific file types
export class DocumentService {
  /**
   * Upload surat permohonan
   */
  static async uploadSuratPermohonan(
    file: File,
    peminjamanId: string
  ): Promise<FileUploadResult> {
    return await FileUploadService.uploadFile(
      file,
      'surat_permohonan',
      `surat_${peminjamanId}`
    )
  }

  /**
   * Upload bukti transfer
   */
  static async uploadBuktiTransfer(
    file: File,
    peminjamanId: string
  ): Promise<FileUploadResult> {
    return await FileUploadService.uploadFile(
      file,
      'bukti_transfer',
      `bukti_${peminjamanId}`
    )
  }

  /**
   * Generate and save SIP document
   */
  static async generateSIP(
    peminjamanId: string,
    sipNumber: string,
    content: string
  ): Promise<FileUploadResult> {
    try {
      // Ensure upload directory exists
      await FileUploadService.ensureUploadDir('sip')

      // Generate filename
      const fileName = `SIP_${sipNumber.replace(/\//g, '_')}.pdf`
      const uploadDir = UPLOAD_DIRS.sip
      const filePath = path.join(uploadDir, fileName)
      const fullPath = path.join(process.cwd(), 'public', filePath)

      // For now, just save as text file (in real implementation, use PDF library)
      await writeFile(fullPath.replace('.pdf', '.txt'), content)

      return {
        success: true,
        message: 'SIP generated successfully',
        filePath: `/${filePath.replace('.pdf', '.txt')}`,
        fileName: fileName.replace('.pdf', '.txt')
      }
    } catch (error) {
      console.error('Error generating SIP:', error)
      return {
        success: false,
        message: 'Failed to generate SIP'
      }
    }
  }
}

// File type validation helper
export function isValidFileType(file: File): boolean {
  return Object.keys(ALLOWED_FILE_TYPES).includes(file.type)
}

// File size validation helper
export function isValidFileSize(file: File): boolean {
  return file.size <= MAX_FILE_SIZE
}

// Get file extension from mime type
export function getFileExtension(mimeType: string): string {
  return ALLOWED_FILE_TYPES[mimeType as keyof typeof ALLOWED_FILE_TYPES] || ''
}