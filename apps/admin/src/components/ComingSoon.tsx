import Topbar from '@/components/layout/Topbar';
import { Card, EmptyState, Button } from '@/components/ui';
import { Construction } from 'lucide-react';
import Link from 'next/link';

export default function ComingSoon({ title, subtitle, description }: {
  title: string; subtitle: string; description: string;
}) {
  return (
    <>
      <Topbar title={title} subtitle={subtitle} />
      <div className="px-6 md:px-10 py-8">
        <Card>
          <EmptyState
            icon={<Construction size={20} strokeWidth={1.5} />}
            title="Module coming next phase"
            description={description}
            action={<Link href="/dashboard"><Button variant="secondary">← Back to Dashboard</Button></Link>}
          />
        </Card>
      </div>
    </>
  );
}
