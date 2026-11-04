import type {LucideIcon} from 'lucide-react';

type Props = {
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
  disabled?: boolean;
};

export function RibbonButton({icon: Icon, label, onClick, disabled = false}: Props) {
  return <button title={label} disabled={disabled} onClick={onClick} className="ribbon-action">
    <Icon size={19} strokeWidth={1.8}/><span>{label}</span>
  </button>;
}
