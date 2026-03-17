import Form from '@/app/ui/reprints/cabinet-reprint-form';
import Breadcrumbs from '@/app/ui/reprints/breadcrumbs';

export default async function Page() {

    return (
        <main>
            <Breadcrumbs
                breadcrumbs={[
                    { label: 'Reprints', href: '/dashboard/reprints' },
                    {
                        label: 'Cabinet',
                        href: '/dashboard/reprints/cabinet',
                        active: true,
                    },
                ]}
            />
            <Form />
        </main>
    );
}