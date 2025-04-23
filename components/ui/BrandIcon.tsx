import Image from 'next/image';

const BrandIcon = () => {
    return (
        <div className="relative flex items-center">
            <Image
                src="/icon.png"
                alt="MCPH Icon"
                width={56}
                height={56}
                className="bg-transparent"
                priority
            />
            <span className="ml-2 font-bold text-3xl text-white">MCPH</span>
        </div>
    );
};

export default BrandIcon;