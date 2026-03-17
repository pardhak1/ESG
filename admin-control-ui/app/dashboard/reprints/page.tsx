import { ReprintCartonLabel, ReprintTrayLabel, ReprintCabinetLabel } from '@/app/ui/reprints/buttons';
import { lusitana } from '@/app/ui/fonts';

export default async function Page() {
    return (
        <div className="w-full">
            <div className="flex w-full items-center justify-between">
                <h1 className={`${lusitana.className} text-2xl`}>Reprints</h1>
            </div>

            <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
                <ReprintCabinetLabel />
            </div>
            <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
                <ReprintTrayLabel />
            </div>
            <div className="mt-4 flex items-center justify-between gap-2 md:mt-8">
                <ReprintCartonLabel />
            </div>

        </div>
    );
}