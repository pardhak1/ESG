import Breadcrumbs from '@/app/ui/kits/breadcrumbs';
import MasterKitTable from '@/app/ui/kits/master-kit-table';

export default async function Page() {
    return (
        <main>
            <Breadcrumbs
                breadcrumbs={[
                    { label: 'Kits', href: '/dashboard/kits', active: true },

                ]}
            />
            <MasterKitTable />
        </main>
    );
}