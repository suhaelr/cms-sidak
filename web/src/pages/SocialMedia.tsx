import { ExternalLink, Facebook, Twitter, Instagram, Youtube } from 'lucide-react';

import { useSEO } from '@/hooks/use-seo';

const socialLinks = [
  { name: 'Facebook', icon: Facebook, url: 'https://facebook.com/bgn', handle: '@BadanGiziNasional', color: 'bg-blue-600' },
  { name: 'Twitter / X', icon: Twitter, url: 'https://twitter.com/bgn_ri', handle: '@bgn_ri', color: 'bg-foreground' },
  { name: 'Instagram', icon: Instagram, url: 'https://instagram.com/bgn_ri', handle: '@bgn_ri', color: 'bg-pink-600' },
  { name: 'YouTube', icon: Youtube, url: 'https://youtube.com/@bgn_ri', handle: 'Badan Gizi Nasional', color: 'bg-red-600' },
];

const SocialMedia = () => {
  useSEO({
    title: 'Media Sosial Resmi',
    description: 'Hubungi dan ikuti perkembangan informasi program Makan Bergizi Gratis melalui akun media sosial resmi Badan Gizi Nasional.',
  });
  return (
    <div className="page-container">
      <h1 className="text-3xl font-bold text-foreground mb-2">Media Sosial</h1>
      <p className="text-muted-foreground mb-8">Ikuti kami untuk update real-time seputar pengawasan SPPG dan Program MBG</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
        {socialLinks.map((social) => {
          const Icon = social.icon;
          return (
            <a
              key={social.name}
              href={social.url}
              target="_blank"
              rel="noopener noreferrer"
              className="card-elevated p-6 text-center hover:shadow-lg transition-shadow group"
            >
              <div className={`w-14 h-14 rounded-full ${social.color} flex items-center justify-center mx-auto mb-4`}>
                <Icon className="w-7 h-7 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-1">{social.name}</h3>
              <p className="text-sm text-muted-foreground mb-3">{social.handle}</p>
              <span className="text-sm text-secondary group-hover:underline flex items-center justify-center gap-1">
                Kunjungi <ExternalLink className="w-3.5 h-3.5" />
              </span>
            </a>
          );
        })}
      </div>

      <div>
        <h2 className="section-title">Postingan Terbaru</h2>
        <p className="section-subtitle">Embed media sosial terbaru dari akun resmi BGN</p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <div key={i} className="card-elevated p-6 flex flex-col items-center justify-center min-h-[280px]">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-3">
                <ExternalLink className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground text-sm text-center">
                Embed postingan media sosial #{i}
              </p>
              <p className="text-xs text-muted-foreground mt-1">(Placeholder)</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default SocialMedia;
