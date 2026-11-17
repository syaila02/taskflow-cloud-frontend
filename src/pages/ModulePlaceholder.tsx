import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Hammer, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/Card';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/Button';

export const ModulePlaceholder: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const getModuleName = (path: string): string => {
    switch (path) {
      case '/tasks':
        return 'My Tasks (Manajemen Tugas)';
      case '/projects':
        return 'Projects (Daftar & Detail Proyek)';
      case '/board':
        return 'Board (Kanban Alur Kerja)';
      case '/calendar':
        return 'Calendar (Pelacakan Tenggat Waktu)';
      case '/team':
        return 'Team (Kolaborasi & Undangan Anggota)';
      case '/settings':
        return 'Settings (Pengaturan Workspace)';
      default:
        return 'Halaman';
    }
  };

  const moduleName = getModuleName(location.pathname);

  return (
    <div className="py-8 max-w-3xl mx-auto">
      <Card>
        <CardContent className="py-12">
          <EmptyState
            icon={<Hammer className="w-6 h-6 text-flow-primary" />}
            title={`Modul ${moduleName}`}
            description="Modul ini dijadwalkan untuk dikerjakan pada Tahap 4-6 setelah modul autentikasi dan API backend terkait siap. Kerangka layout, sidebar, dan header telah siap terintegrasi."
            action={
              <Button
                variant="outline"
                size="sm"
                leftIcon={<ArrowLeft className="w-4 h-4" />}
                onClick={() => navigate('/')}
              >
                Kembali ke Overview Workspace
              </Button>
            }
          />
        </CardContent>
      </Card>
    </div>
  );
};
