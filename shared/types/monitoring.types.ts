// Monitoring Types and Interfaces

// Log levels following standard severity
export enum LogLevel {
  TRACE = 0,
  DEBUG = 1,
  INFO = 2,
  WARN = 3,
  ERROR = 4,
  FATAL = 5
}

// Process type
export type ProcessType = 'main' | 'renderer'

// Base context interface
export interface BaseContext {
  process: ProcessType
  module: string
  userId?: string
  sessionId: string
  timestamp: number
  [key: string]: any
}

// Log entry
export interface LogEntry {
  timestamp: number
  level: LogLevel
  message: string
  context: BaseContext
}

// Metric types
export type MetricType = 'counter' | 'gauge' | 'histogram' | 'summary'

// Metric entry
export interface MetricEntry {
  timestamp: number
  name: string
  value: number
  type: MetricType
  tags: Record<string, string>
  unit?: string
}

// Trace status
export type TraceStatus = 'ok' | 'error' | 'cancelled'

// Trace entry
export interface TraceEntry {
  traceId: string
  spanId: string
  parentSpanId?: string
  operation: string
  startTime: number
  endTime: number
  duration: number
  status: TraceStatus
  attributes: Record<string, any>
}

// Error severity
export type ErrorSeverity = 'low' | 'medium' | 'high' | 'critical'

// Error context
export interface ErrorContext extends BaseContext {
  severity?: ErrorSeverity
  userImpact?: boolean
  recoverable?: boolean
}

// Error entry
export interface ErrorEntry {
  timestamp: number
  error: {
    name: string
    message: string
    stack?: string
    code?: string
  }
  context: ErrorContext
  severity: ErrorSeverity
}

// Provider capabilities
export interface ProviderCapabilities {
  supportsLogs: boolean
  supportsMetrics: boolean
  supportsTraces: boolean
  supportsErrors: boolean
}

// Provider configuration
export interface ProviderConfig {
  id: string
  type: 'console' | 'file' | 'remote'
  enabled: boolean
}

// Console provider config
export interface ConsoleProviderConfig extends ProviderConfig {
  type: 'console'
  format: 'json' | 'pretty'
  colors: boolean
  includeTimestamp: boolean
}

// File provider config
export interface FileProviderConfig extends ProviderConfig {
  type: 'file'
  directory: string
  filename: string
  maxFileSize: number // bytes
  maxFiles: number
  compress: boolean
  rotationInterval: 'daily' | 'hourly' | 'size'
}

// Remote provider config
export interface RemoteProviderConfig extends ProviderConfig {
  type: 'remote'
  endpoint: string
  apiKey: string
  batchSize: number
  flushInterval: number // ms
  timeout: number // ms
  retry: {
    maxAttempts: number
    backoffMs: number
    maxBackoffMs: number
  }
  headers?: Record<string, string>
}

// Privacy configuration
export interface PrivacyConfig {
  excludeUserPaths: boolean
  excludeGitCredentials: boolean
  anonymizeUserId: boolean
  excludeEnvironmentVars: boolean
  sanitizePatterns: RegExp[]
}

// Feature flags
export interface MonitoringFeatures {
  logs: boolean
  metrics: boolean
  traces: boolean
  errors: boolean
  performance: boolean
  network: boolean
}

// Main monitoring configuration
export interface MonitoringConfig {
  enabled: boolean
  logLevel: LogLevel
  samplingRate: number // 0-1
  
  // Buffer settings
  bufferSize: number
  flushInterval: number // ms
  
  // Privacy settings
  privacy: PrivacyConfig
  
  // Provider configurations
  providers: {
    console?: ConsoleProviderConfig
    file?: FileProviderConfig
    remote?: RemoteProviderConfig
  }
  
  // Feature flags
  features: MonitoringFeatures
  
  // Performance settings
  performance: {
    maxExecutionTime: number // ms - operations taking longer will be logged
    slowOperationThreshold: number // ms
    memoryCheckInterval: number // ms
    cpuCheckInterval: number // ms
  }
}

// Monitoring provider interface
export interface IMonitoringProvider {
  id: string
  type: 'console' | 'file' | 'remote'
  capabilities: ProviderCapabilities
  
  // Provider methods
  log?(entry: LogEntry): Promise<void>
  metric?(metric: MetricEntry): Promise<void>
  trace?(trace: TraceEntry): Promise<void>
  error?(error: ErrorEntry): Promise<void>
  
  // Lifecycle
  connect(config: ProviderConfig): Promise<void>
  disconnect(): Promise<void>
  flush(): Promise<void>
  
  // Health check
  isHealthy(): Promise<boolean>
}

// Main monitoring service interface
export interface IMonitoringService {
  // Core monitoring functions
  log(level: LogLevel, message: string, context?: Partial<BaseContext>): void
  metric(name: string, value: number, tags?: Record<string, string>): void
  trace<T>(operation: string, fn: () => T | Promise<T>): Promise<T>
  error(error: Error, context?: Partial<ErrorContext>): void
  
  // Lifecycle management
  initialize(config: MonitoringConfig): Promise<void>
  shutdown(): Promise<void>
  
  // Provider management
  addProvider(provider: IMonitoringProvider): void
  removeProvider(providerId: string): void
  getProviders(): IMonitoringProvider[]
  
  // Configuration
  updateConfig(config: Partial<MonitoringConfig>): void
  getConfig(): MonitoringConfig
  
  // Utilities
  createChildLogger(module: string): IModuleLogger
  flush(): Promise<void>
  getStats(): MonitoringStats
}

// Module-specific logger
export interface IModuleLogger {
  module: string
  log(level: LogLevel, message: string, context?: Record<string, any>): void
  debug(message: string, context?: Record<string, any>): void
  info(message: string, context?: Record<string, any>): void
  warn(message: string, context?: Record<string, any>): void
  error(message: string | Error, context?: Record<string, any>): void
}

// Monitoring statistics
export interface MonitoringStats {
  logs: {
    total: number
    byLevel: Record<LogLevel, number>
    dropped: number
  }
  metrics: {
    total: number
    byType: Record<MetricType, number>
  }
  traces: {
    total: number
    active: number
    completed: number
    failed: number
  }
  errors: {
    total: number
    bySeverity: Record<ErrorSeverity, number>
  }
  performance: {
    avgLogTime: number
    avgMetricTime: number
    avgTraceTime: number
    bufferUsage: number
  }
}

// Performance monitoring helpers
export interface PerformanceMetrics {
  cpu: {
    usage: number
    system: number
    user: number
  }
  memory: {
    heapUsed: number
    heapTotal: number
    rss: number
    external: number
  }
  eventLoop: {
    lag: number
    utilization: number
  }
}

// Operation metadata for tracing
export interface OperationMetadata {
  name: string
  type: 'git' | 'ipc' | 'file' | 'network' | 'render' | 'other'
  parentOperation?: string
  tags?: Record<string, string>
  important?: boolean
}

// Sanitization options
export interface SanitizationOptions {
  paths: boolean
  urls: boolean
  emails: boolean
  tokens: boolean
  custom?: RegExp[]
}

// Export type guards
export function isLogEntry(entry: any): entry is LogEntry {
  return entry && 
    typeof entry.timestamp === 'number' &&
    typeof entry.level === 'number' &&
    typeof entry.message === 'string' &&
    entry.context && typeof entry.context === 'object'
}

export function isMetricEntry(entry: any): entry is MetricEntry {
  return entry &&
    typeof entry.timestamp === 'number' &&
    typeof entry.name === 'string' &&
    typeof entry.value === 'number' &&
    typeof entry.type === 'string'
}

export function isTraceEntry(entry: any): entry is TraceEntry {
  return entry &&
    typeof entry.traceId === 'string' &&
    typeof entry.spanId === 'string' &&
    typeof entry.operation === 'string' &&
    typeof entry.startTime === 'number' &&
    typeof entry.endTime === 'number'
}

export function isErrorEntry(entry: any): entry is ErrorEntry {
  return entry &&
    typeof entry.timestamp === 'number' &&
    entry.error && typeof entry.error === 'object' &&
    typeof entry.error.name === 'string' &&
    typeof entry.error.message === 'string'
}