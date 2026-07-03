import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/query-client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { FeatureFlagsProvider } from "@/contexts/FeatureFlagsContext";
import { ThemeProvider } from "next-themes";
import ProtectedRoute from "@/components/ProtectedRoute";
import FeatureFlagRoute from "@/components/FeatureFlagRoute";
import PublicLayout from "@/components/layout/PublicLayout";
import AdminLayout from "@/components/layout/AdminLayout";
import Index from "./pages/Index";
import Berita from "./pages/Berita";
import BeritaDetail from "./pages/BeritaDetail";
import SocialMedia from "./pages/SocialMedia";
import DokumentasiSidak from "./pages/DokumentasiSidak";
import SidakDetail from "./pages/SidakDetail";
import DaftarSanksi from "./pages/DaftarSanksi";
import SanksiDetail from "./pages/SanksiDetail";
import DownloadDokumen from "./pages/DownloadDokumen";
import KanalPengaduan from "./pages/KanalPengaduan";
import AdminLogin from "./pages/AdminLogin";
import AdminLoginCallback from "./pages/AdminLoginCallback";
import AdminDashboard from "./pages/admin/AdminDashboard";
import BeritaListPage from "./pages/admin/berita/list";
import BeritaFormPage from "./pages/admin/berita/form";
import CommentModerationPage from "./pages/admin/berita/comments";
import SidakListPage from "./pages/admin/sidak/list";
import SidakFormPage from "./pages/admin/sidak/form";
import SanksiListPage from "./pages/admin/sanksi/list";
import SanksiFormPage from "./pages/admin/sanksi/form";
import DokumenListPage from "./pages/admin/dokumen/list";
import DokumenFormPage from "./pages/admin/dokumen/form";
import TindakLanjutListPage from "./pages/admin/tindak-lanjut/list";
import TindakLanjutFormPage from "./pages/admin/tindak-lanjut/form";
import PengaduanListPage from "./pages/admin/pengaduan/list";
import PengaduanDetailPage from "./pages/admin/pengaduan/detail";
import UsersListPage from "./pages/admin/users/list";
import UsersFormPage from "./pages/admin/users/form";
import HeroSlidesListPage from "./pages/admin/hero-slides/list";
import HeroSlidesFormPage from "./pages/admin/hero-slides/form";
import MasterDataLayout from "./pages/admin/master-data/layout";
import KitchensListPage from "./pages/admin/master-data/kitchens/list";
import KitchensFormPage from "./pages/admin/master-data/kitchens/form";
import NewsCategoriesListPage from "./pages/admin/master-data/news-categories/list";
import NewsCategoriesFormPage from "./pages/admin/master-data/news-categories/form";
import FindingCategoriesListPage from "./pages/admin/master-data/finding-categories/list";
import FindingCategoriesFormPage from "./pages/admin/master-data/finding-categories/form";
import SanctionTypesListPage from "./pages/admin/master-data/sanction-types/list";
import SanctionTypesFormPage from "./pages/admin/master-data/sanction-types/form";
import StatusListPage from "./pages/admin/master-data/status/list";
import DemoCredentials from "./pages/DemoCredentials";
import NotFound from "./pages/NotFound";

const PublicPage = ({ children }: { children: React.ReactNode }) => (
  <PublicLayout>{children}</PublicLayout>
);

const AdminPage = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <AdminLayout>{children}</AdminLayout>
  </ProtectedRoute>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider attribute="class" defaultTheme="light" enableSystem={false}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AuthProvider>
            <FeatureFlagsProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<PublicPage><Index /></PublicPage>} />
            <Route path="/berita" element={<PublicPage><Berita /></PublicPage>} />
            <Route path="/berita/:slug" element={<PublicPage><BeritaDetail /></PublicPage>} />
            <Route path="/social-media" element={<PublicPage><FeatureFlagRoute flag="menu_social_media"><SocialMedia /></FeatureFlagRoute></PublicPage>} />
            <Route path="/dokumentasi-sidak" element={<PublicPage><FeatureFlagRoute flag="menu_sidak_management"><DokumentasiSidak /></FeatureFlagRoute></PublicPage>} />
            <Route path="/dokumentasi-sidak/:id" element={<PublicPage><FeatureFlagRoute flag="menu_sidak_management"><SidakDetail /></FeatureFlagRoute></PublicPage>} />
            <Route path="/daftar-sanksi" element={<PublicPage><FeatureFlagRoute flag="menu_sanksi"><DaftarSanksi /></FeatureFlagRoute></PublicPage>} />
            <Route path="/daftar-sanksi/:id" element={<PublicPage><FeatureFlagRoute flag="menu_sanksi"><SanksiDetail /></FeatureFlagRoute></PublicPage>} />
            <Route path="/download-dokumen" element={<PublicPage><FeatureFlagRoute flag="menu_dokumen"><DownloadDokumen /></FeatureFlagRoute></PublicPage>} />
            <Route path="/kanal-pengaduan" element={<PublicPage><FeatureFlagRoute flag="menu_pengaduan"><KanalPengaduan /></FeatureFlagRoute></PublicPage>} />

            {/* Admin Routes */}
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/login/callback" element={<AdminLoginCallback />} />
            <Route path="/admin" element={<AdminPage><AdminDashboard /></AdminPage>} />

            <Route path="/admin/sidak" element={<AdminPage><FeatureFlagRoute flag="menu_sidak_management" redirectTo="/admin"><SidakListPage /></FeatureFlagRoute></AdminPage>} />
            <Route path="/admin/sidak/create" element={<AdminPage><FeatureFlagRoute flag="menu_sidak_management" redirectTo="/admin"><SidakFormPage /></FeatureFlagRoute></AdminPage>} />
            <Route path="/admin/sidak/:id/edit" element={<AdminPage><FeatureFlagRoute flag="menu_sidak_management" redirectTo="/admin"><SidakFormPage /></FeatureFlagRoute></AdminPage>} />

            <Route path="/admin/tindak-lanjut" element={<AdminPage><FeatureFlagRoute flag="menu_tindak_lanjut" redirectTo="/admin"><TindakLanjutListPage /></FeatureFlagRoute></AdminPage>} />
            <Route path="/admin/tindak-lanjut/create" element={<AdminPage><FeatureFlagRoute flag="menu_tindak_lanjut" redirectTo="/admin"><TindakLanjutFormPage /></FeatureFlagRoute></AdminPage>} />
            <Route path="/admin/tindak-lanjut/:id/edit" element={<AdminPage><FeatureFlagRoute flag="menu_tindak_lanjut" redirectTo="/admin"><TindakLanjutFormPage /></FeatureFlagRoute></AdminPage>} />

            <Route path="/admin/sanksi" element={<AdminPage><FeatureFlagRoute flag="menu_sanksi" redirectTo="/admin"><SanksiListPage /></FeatureFlagRoute></AdminPage>} />
            <Route path="/admin/sanksi/create" element={<AdminPage><FeatureFlagRoute flag="menu_sanksi" redirectTo="/admin"><SanksiFormPage /></FeatureFlagRoute></AdminPage>} />
            <Route path="/admin/sanksi/:id/edit" element={<AdminPage><FeatureFlagRoute flag="menu_sanksi" redirectTo="/admin"><SanksiFormPage /></FeatureFlagRoute></AdminPage>} />

            <Route path="/admin/berita" element={<AdminPage><BeritaListPage /></AdminPage>} />
            <Route path="/admin/berita/create" element={<AdminPage><BeritaFormPage /></AdminPage>} />
            <Route path="/admin/berita/:id/edit" element={<AdminPage><BeritaFormPage /></AdminPage>} />
            <Route path="/admin/komentar" element={<AdminPage><CommentModerationPage /></AdminPage>} />

            <Route path="/admin/dokumen" element={<AdminPage><FeatureFlagRoute flag="menu_dokumen" redirectTo="/admin"><DokumenListPage /></FeatureFlagRoute></AdminPage>} />
            <Route path="/admin/dokumen/create" element={<AdminPage><FeatureFlagRoute flag="menu_dokumen" redirectTo="/admin"><DokumenFormPage /></FeatureFlagRoute></AdminPage>} />
            <Route path="/admin/dokumen/:id/edit" element={<AdminPage><FeatureFlagRoute flag="menu_dokumen" redirectTo="/admin"><DokumenFormPage /></FeatureFlagRoute></AdminPage>} />

            <Route path="/admin/pengaduan" element={<AdminPage><FeatureFlagRoute flag="menu_pengaduan" redirectTo="/admin"><PengaduanListPage /></FeatureFlagRoute></AdminPage>} />
            <Route path="/admin/pengaduan/:id" element={<AdminPage><FeatureFlagRoute flag="menu_pengaduan" redirectTo="/admin"><PengaduanDetailPage /></FeatureFlagRoute></AdminPage>} />

            <Route path="/admin/master-data" element={<AdminPage><MasterDataLayout /></AdminPage>}>
              <Route path="kitchens" element={<KitchensListPage />} />
              <Route path="kitchens/create" element={<KitchensFormPage />} />
              <Route path="kitchens/:id/edit" element={<KitchensFormPage />} />
              <Route path="news-categories" element={<NewsCategoriesListPage />} />
              <Route path="news-categories/create" element={<NewsCategoriesFormPage />} />
              <Route path="news-categories/:id/edit" element={<NewsCategoriesFormPage />} />
              <Route path="finding-categories" element={<FindingCategoriesListPage />} />
              <Route path="finding-categories/create" element={<FindingCategoriesFormPage />} />
              <Route path="finding-categories/:id/edit" element={<FindingCategoriesFormPage />} />
              <Route path="sanction-types" element={<SanctionTypesListPage />} />
              <Route path="sanction-types/create" element={<SanctionTypesFormPage />} />
              <Route path="sanction-types/:id/edit" element={<SanctionTypesFormPage />} />
              <Route path="status" element={<StatusListPage />} />
            </Route>

            <Route path="/admin/users" element={<AdminPage><UsersListPage /></AdminPage>} />
            <Route path="/admin/users/create" element={<AdminPage><UsersFormPage /></AdminPage>} />

            <Route path="/admin/hero-slides" element={<AdminPage><HeroSlidesListPage /></AdminPage>} />
            <Route path="/admin/hero-slides/create" element={<AdminPage><HeroSlidesFormPage /></AdminPage>} />
            <Route path="/admin/hero-slides/:id/edit" element={<AdminPage><HeroSlidesFormPage /></AdminPage>} />

            {/* Demo & Utility */}
            <Route path="/demo-credentials" element={<DemoCredentials />} />

            <Route path="*" element={<NotFound />} />
          </Routes>
          </FeatureFlagsProvider>
        </AuthProvider>
      </BrowserRouter>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
