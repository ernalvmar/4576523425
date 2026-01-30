// --- TYPES & INTERFACES ---

export type ArticleStatus = 'Con stock' | 'Pedir a proveedor' | 'CRÍTICO' | 'Sin stock';

export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
  role: 'Admin' | 'Operario';
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

export interface AppState {
  articles: Article[];
  inbounds: InboundMovement[];
  manualConsumptions: ManualConsumption[];
  adjustments: StockAdjustment[];
  loads: OperationalLoad[];
  closings: MonthClosing[];
  billingOverrides: Record<string, number>;
}
