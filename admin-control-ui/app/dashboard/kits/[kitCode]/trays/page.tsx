import Form from '@/app/ui/reprints/tray-reprint-form';
import Breadcrumbs from '@/app/ui/kits/breadcrumbs';
import MasterTrayTable from '@/app/ui/kits/master-tray-table';

export default async function Page(props: { params: Promise<{ kitCode: string }> }) {
    const params = await props.params;
    const kitCode: string = params.kitCode;

    return (
        <main>
            <Breadcrumbs
                breadcrumbs={[
                    { label: 'Kits', href: '/dashboard/kits' },
                    {
                        label: `${kitCode}`,
                        href: `/dashboard/kits`,
                    },
                    {
                        label: 'Trays',
                        href: `/dashboard/kits/${kitCode}/trays`,
                        active: true,
                    },
                ]}
            />
            <MasterTrayTable kitCode={kitCode} />
        </main>
    );
}