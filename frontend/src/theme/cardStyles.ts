export const baseCardStyle = {
  borderRadius: 3,
  bgcolor: 'background.paper',
  boxShadow: '0 10px 30px rgba(15,23,42,0.08)',
  transition: 'all 0.3s ease',
} as const;

export const baseCardHoverStyle = {
  '&:hover': {
    boxShadow: '0 20px 40px rgba(15,23,42,0.12)',
    transform: 'translateY(-3px)'
  }
} as const;
