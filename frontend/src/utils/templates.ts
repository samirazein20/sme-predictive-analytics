// Utility functions to generate downloadable CSV templates for SMEs
// Each template kept intentionally small (minimum viable columns) to reduce friction.

export type TemplateType = 'retail' | 'service' | 'ecommerce';

interface TemplateMeta {
  filename: string;
  description: string;
  header: string[];
  sampleRows: string[][]; // first 5 illustrative rows
}

const retailTemplate: TemplateMeta = {
  filename: 'retail_sales_template.csv',
  description: 'Daily retail sales with product category segmentation',
  header: ['Date', 'Revenue', 'Units', 'Category'],
  sampleRows: [
    ['2024-01-01', '2400', '62', 'Coffee'],
    ['2024-01-02', '2850', '78', 'Coffee'],
    ['2024-01-03', '1950', '51', 'Pastries'],
    ['2024-01-04', '3200', '89', 'Coffee'],
    ['2024-01-05', '2700', '72', 'Mixed']
  ]
};

const serviceTemplate: TemplateMeta = {
  filename: 'service_business_template.csv',
  description: 'Service bookings with revenue and labor hours',
  header: ['Date', 'Bookings', 'Revenue', 'Labor_Hours'],
  sampleRows: [
    ['2024-01-01', '14', '980', '42'],
    ['2024-01-02', '18', '1260', '55'],
    ['2024-01-03', '12', '840', '38'],
    ['2024-01-04', '20', '1400', '60'],
    ['2024-01-05', '16', '1120', '48']
  ]
};

const ecommerceTemplate: TemplateMeta = {
  filename: 'ecommerce_template.csv',
  description: 'E-commerce daily performance with marketing spend & traffic',
  header: ['Date', 'Orders', 'Revenue', 'Marketing_Spend', 'Traffic'],
  sampleRows: [
    ['2024-01-01', '45', '8500', '1200', '1820'],
    ['2024-01-02', '52', '9200', '1350', '1955'],
    ['2024-01-03', '41', '7800', '1100', '1760'],
    ['2024-01-04', '58', '10500', '1500', '2100'],
    ['2024-01-05', '48', '9100', '1280', '1885']
  ]
};

const TEMPLATE_MAP: Record<TemplateType, TemplateMeta> = {
  retail: retailTemplate,
  service: serviceTemplate,
  ecommerce: ecommerceTemplate,
};

export function getTemplateMeta(type: TemplateType): TemplateMeta {
  return TEMPLATE_MAP[type];
}

export function generateTemplateCSV(type: TemplateType): string {
  const meta = getTemplateMeta(type);
  const rows = [meta.header, ...meta.sampleRows];
  return rows.map(r => r.join(',')).join('\n') + '\n';
}

export function formatSamplePreview(type: TemplateType): string {
  const meta = getTemplateMeta(type);
  const headerLine = meta.header.join(' | ');
  const sampleLines = meta.sampleRows.map(r => r.join(' | '));
  return [headerLine, ...sampleLines].join('\n');
}

export const DATA_REQUIREMENTS = [
  '✓ At least 30 days of data (more is better)',
  '✓ Date column in any common format (YYYY-MM-DD preferred)',
  '✓ At least one numeric metric (revenue, sales, customers)',
  '✓ Optional: categories, regions, or other dimensions for deeper insights'
];
