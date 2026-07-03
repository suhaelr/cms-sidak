import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Calendar, MapPin, User, Camera, FileText, Clock } from 'lucide-react';
import { inspections, findings, followUps } from '@/data/mockData';
import StatusBadge from '@/components/shared/StatusBadge';

const SidakDetail = () => {
  const { id } = useParams();
  const inspection = inspections.find((i) => i.id === id);
  const inspFindings = findings.filter((f) => f.inspectionId === id);
  const inspFollowUps = followUps.filter((f) => f.inspectionId === id);

  if (!inspection) {
    return (
      <div className="page-container">
        <div className="empty-state">
          <p className="text-muted-foreground">Data sidak tidak ditemukan.</p>
          <Link to="/dokumentasi-sidak" className="mt-4 text-secondary hover:underline">← Kembali</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-container">
      <Link to="/dokumentasi-sidak" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6">
        <ArrowLeft className="w-4 h-4" /> Kembali ke Dokumentasi Sidak
      </Link>

      {/* Summary */}
      <div className="card-elevated p-6 mb-6">
        <div className="flex flex-wrap items-center gap-3 mb-4">
          <StatusBadge status={inspection.severity} size="md" />
          <StatusBadge status={inspection.followUpStatus} size="md" />
          <StatusBadge status={inspection.publicationStatus} size="md" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {inspection.showIdentity ? inspection.kitchenName : inspection.kitchenCode}
        </h1>
        <div className="flex flex-wrap gap-4 text-sm text-muted-foreground mb-4">
          <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {inspection.date}</span>
          <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {inspection.regionName}</span>
          <span className="flex items-center gap-1"><User className="w-4 h-4" /> {inspection.createdBy}</span>
        </div>
        <p className="text-foreground/80">{inspection.summary}</p>
      </div>

      {/* Findings */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5" /> Temuan ({inspFindings.length})
        </h2>
        <div className="space-y-3">
          {inspFindings.map((finding, i) => (
            <div key={finding.id} className="card-elevated p-5">
              <div className="flex items-center gap-3 mb-2">
                <span className="text-sm font-medium text-foreground">#{i + 1}</span>
                <span className="badge-status bg-primary/10 text-primary">{finding.category}</span>
                <StatusBadge status={finding.severity} />
              </div>
              <p className="text-foreground/90 mb-2">{finding.description}</p>
              <p className="text-sm text-muted-foreground">
                <strong>Rekomendasi:</strong> {finding.recommendation}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Media gallery */}
      {inspection.showMedia && (
        <div className="mb-6">
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Camera className="w-5 h-5" /> Dokumentasi Foto/Video
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-muted rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <Camera className="w-6 h-6 text-muted-foreground mx-auto mb-1" />
                  <span className="text-xs text-muted-foreground">Foto {i}</span>
                  <span className="text-xs text-muted-foreground block">(Watermark)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Follow-up timeline */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
          <Clock className="w-5 h-5" /> Timeline Tindak Lanjut
        </h2>
        {inspFollowUps.length === 0 ? (
          <p className="text-muted-foreground">Belum ada tindak lanjut.</p>
        ) : (
          <div className="relative pl-6 border-l-2 border-border space-y-6">
            {inspFollowUps.map((fu) => (
              <div key={fu.id} className="relative">
                <div className="absolute -left-[29px] w-4 h-4 rounded-full bg-card border-2 border-secondary" />
                <div className="card-elevated p-4">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="font-medium text-foreground">{fu.actionType}</span>
                    <StatusBadge status={fu.status} />
                  </div>
                  <p className="text-sm text-foreground/80 mb-2">{fu.notes}</p>
                  <div className="flex gap-4 text-xs text-muted-foreground">
                    <span>PIC: {fu.pic}</span>
                    <span>Deadline: {fu.deadline}</span>
                    <span>Tanggal: {fu.date}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SidakDetail;
