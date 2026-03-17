import Breadcrumbs from '@/app/ui/kits/breadcrumbs';
import Planogram from '@/app/ui/kits/planogram';
import StationForm from '@/app/ui/kits/station-form';

export default async function Page(props: { params: Promise<{ trayCode: string; kitCode: string }> }) {
    const params = await props.params;
    const kitCode: string = params.kitCode;
    const trayCode: string = params.trayCode;

    return (
        <main>
            <Breadcrumbs
                breadcrumbs={[
                    { label: 'Kits', href: '/dashboard/kits' },
                    {
                        label: `${kitCode}`,
                        href: `/dashboard/kits/`,
                    },
                    {
                        label: 'Trays',
                        href: `/dashboard/kits/${kitCode}/trays`,
                    },
                    {
                        label: `${trayCode}`,
                        href: `/dashboard/kits/${kitCode}/trays`,
                    },
                    {
                        label: 'Edit Stations',
                        href: `/dashboard/kits/${kitCode}/trays/${trayCode}/editStations`,
                        active: true
                    },
                ]}
            />
            <StationForm kitCode={kitCode} trayCode={trayCode} />
        </main>
    );
}