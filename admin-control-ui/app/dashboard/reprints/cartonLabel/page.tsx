import Form from '@/app/ui/reprints/carton-reprint-form';
import Breadcrumbs from '@/app/ui/reprints/breadcrumbs';

export default async function Page() {

    return (
        <main>
            <Breadcrumbs
                breadcrumbs={[
                    { label: 'Reprints', href: '/dashboard/reprints' },
                    {
                        label: 'Carton',
                        href: '/dashboard/reprints/carton',
                        active: true,
                    },
                ]}
            />
            <Form />
        </main>
    );
}