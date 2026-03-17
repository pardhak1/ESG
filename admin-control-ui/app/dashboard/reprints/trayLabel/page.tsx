import Form from '@/app/ui/reprints/tray-reprint-form';
import Breadcrumbs from '@/app/ui/reprints/breadcrumbs';

export default async function Page() {

    return (
        <main>
            <Breadcrumbs
                breadcrumbs={[
                    { label: 'Reprints', href: '/dashboard/reprints' },
                    {
                        label: 'Tray',
                        href: '/dashboard/reprints/tray',
                        active: true,
                    },
                ]}
            />
            <Form />
        </main>
    );
}