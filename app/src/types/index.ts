// --- TYPES & INTERFACES ---

export type ArticleStatus = 'Con stock' | 'Pedir a proveedor' | 'CRÍTICO' | 'Sin stock';

export interface User {
  id: number;
  email: string;
  nombre: string;
  rol: 'operario' | 'responsable';
}

export interface Article {
  sku: string;
  nombre: string;
  tipo: 'Nuevo' | 'Usado';
  unidad: string;
  stock_seguridad: number;
  stock_inicial: number;
  proveedor: string;
  imagen_url?: string;
  lead_time_dias: number;
  activo: boolean;
  fecha_alta: string;
  ultimo_coste?: number;
  precio_venta?: number;
}

export interface StockAdjustment {
  id: string;
  date: string;
  sku: string;
  oldQuantity: number;
  newQuantity: number;
  delta: number;
  reason: string;
  user: string;
  type: 'physical_count' | 'adjustment';
}

export interface InboundMovement {
  id: string;
  date: string;
  type: 'Compra' | 'Logística Inversa';
  sku: string;
  quantity: number;
  user: string;
  proveedor?: string;
  albaran?: string;
  coste_unitario?: number;
  contenedor?: string;
  precinto?: string;
}

export interface ManualConsumption {
  id: string;
  date: string;
  sku: string;
  quantity: number;
  reason: string;
  user: string;
}

export interface OperationalLoad {
  load_uid: string;
  ref_carga: string;
  precinto: string;
  flete: string;
  date: string;
  consumptions: Record<string, number>;
  duplicado: boolean;
  modificada: boolean;
  original_fingerprint: string;
  adr_breakdown?: Record<string, number>;
  periodo?: string;
}

export interface MonthClosing {
  month: string;
  status: 'OPEN' | 'CLOSED';
  closed_by?: string;
  closed_at?: string;
}

export interface InventoryItem extends Article {
  stockActual: number;
  situacion: ArticleStatus;
  totalInbound: number;
  totalManualOut: number;
  totalLoadOut: number;
  avgWeeklyConsumption: number;
  suggestedOrder: number;
  targetStock: number;
}

export interface GeneralExpense {
  id: number;
  container_id: string;
  description: string;
  quantity: number;
  order_number: string;
  provider: string;
  date: string;
  period: string;
}

export type StorageEntryProcedure = 'DESTRUIR' | 'ENVIAR' | 'RECOGER';

export interface StorageEntry {
  id: number;
  container_id: string;
  order_numbers: string;
  provider: string;
  entry_date: string;
  exit_date?: string;
  procedure: StorageEntryProcedure;
  comments: string;
  status: 'ACTIVE' | 'CLOSED';
  billing_start_date: string;
  billable_days?: number;
  amount?: string;
}

export interface PalletConsumption {
  id: number;
  movement_id?: number;
  date: string;
  agency: string;
  provider: string;
  order_ref: string;
  weight: number;
  num_packages: number;
  resulting_pallets: number;
}

export interface AppState {
  articles: Article[];
  inbounds: InboundMovement[];
  manualConsumptions: ManualConsumption[];
  adjustments: StockAdjustment[];
  loads: OperationalLoad[];
  closings: MonthClosing[];
  billingOverrides: Record<string, number>;
  generalExpenses: GeneralExpense[];
  storageEntries: StorageEntry[];
  obramatProviders: string[];
  palletConsumptions: PalletConsumption[];
}
