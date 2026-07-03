import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, AlertTriangle, ExternalLink } from 'lucide-react';
import { sanctions, inspections, DISCLAIMER_TEXT } from '@/data/mockData';
import StatusBadge from '@/components/shared/StatusBadge';

const SanksiDetail = () => {
  const { id } = useParams();
  const sanction = sanctions.find(s => s.id === id);

  if (!sanction) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p className="text-muted-foreground">Data sanksi tidak ditemukan.</p>
          <Link to="/daftar-sanksi" className="mt-4 text-secondary hover:underline">← Kembali</Link>
        </div>
      </div>
    );
  }

  const relatedInspection = inspections.find(i => i.id === sanction.inspectionId);

  return (
    <div className="page-container max-w-3xl">
      <Link to="/daftar-sanksi" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Daftar Sanksi
      </Link>

      <div className="disclaimer-banner mb-6 flex items-start gap-3">
        <AlertTriangle className="w-5 h-5 text-warning flex-shrink-0 mt-0.5" />
        <p>{DISCLAIMER_TEXT}</p>
      </div>

      <div className="card-elevated p-6 mb-6">
        <div className="flex items-center gap-3 mb-4">
          <span className="badge-status bg-destructive/10 text-destructive">{sanction.sanctionType}</span>
          <StatusBadge status={sanction.followUpStatus} size="md" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-4">
          {sanction.showIdentity ? sanction.kitchenCode : `${sanction.kitchenCode.substring(0, 8)}***`}
        </h1>

        <dl className="space-y-3">
          <div><dt className="text-sm text-muted-foreground">Wilayah</dt><dd className="font-medium">{sanction.regionName}</dd></div>
          <div><dt className="text-sm text-muted-foreground">Ringkasan Pelanggaran</dt><dd className="text-foreground/90">{sanction.violationSummary}</dd></div>
          <div><dt className="text-sm text-muted-foreground">Tanggal Penetapan</dt><dd>{sanction.date}</dd></div>
          <div><dt className="text-sm text-muted-foreground">Status</dt><dd><StatusBadge status={sanction.status} size="md" /></dd></div>
        </dl>
      </div>

      {relatedInspection && relatedInspection.publicationStatus === 'published' && (
        <div className="card-elevated p-5">
          <h3 className="font-semibold text-foreground mb-2">Sidak Terkait</h3>
          <Link to={`/dokumentasi-sidak/${relatedInspection.id}`} className="text-secondary hover:underline flex items-center gap-1">
            {relatedInspection.showIdentity ? relatedInspection.kitchenName : relatedInspection.kitchenCode} — {relatedInspection.date}
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default SanksiDetail;
