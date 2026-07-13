interface MelodicAnchorLimitNoticeProps {
  visible: boolean;
  limit?: number;
}

export default function MelodicAnchorLimitNotice({
  visible,
  limit = 32
}: MelodicAnchorLimitNoticeProps) {
  if (!visible) {
    return null;
  }

  return (
    <div className="text-amber-500/80 text-xs font-bold bg-amber-500/10 px-4 py-2 rounded-lg border border-amber-500/20 text-center">
      Leitura focada nas primeiras {limit} notas estruturais desta seção.
    </div>
  );
}
