import { lusitana } from '@/app/ui/fonts';
import Image from 'next/image';

export default function ElevateLogo() {
  return (
    <div
      className={`${lusitana.className} flex flex-row items-center leading-none text-white`}
    >

      <Image
        src="/esglogo.png"
        width={1000}
        height={760}
        className="hidden md:block"
        alt="Elevate"
      />
    </div>
  );
}
