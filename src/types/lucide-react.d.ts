declare module 'lucide-react' {
  import * as React from 'react';
  export interface LucideProps extends React.SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
  }
  export type LucideIcon = React.FC<LucideProps>;
  export const Scissors: LucideIcon;
  export const Users: LucideIcon;
  export const Clock: LucideIcon;
  export const ArrowRight: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const ShieldCheck: LucideIcon;
  export const ShieldAlert: LucideIcon;
  export const Sparkles: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const AlertTriangle: LucideIcon;
  export const Check: LucideIcon;
  export const CheckCircle: LucideIcon;
  export const XCircle: LucideIcon;
  export const UserX: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const Bell: LucideIcon;
  export const Plus: LucideIcon;
  export const Phone: LucideIcon;
  export const UserCheck: LucideIcon;
  export const Play: LucideIcon;
  export const Coffee: LucideIcon;
  export const Volume2: LucideIcon;
  export const VolumeX: LucideIcon;
  export const Settings: LucideIcon;
  export const RotateCcw: LucideIcon;
  export const RefreshCw: LucideIcon;
  export const Edit2: LucideIcon;
  export const X: LucideIcon;
  export const Globe: LucideIcon;
  export const Tv: LucideIcon;
  export const Heart: LucideIcon;
}
