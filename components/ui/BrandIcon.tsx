import Image from 'next/image';

const BrandIcon = () => {
    return (
        <Image
            src="/icon-transparent.png"
            alt="MCP Hub Icon"
            width={180}
            height={180}
            className="bg-transparent"
        />
    );
};

export default BrandIcon;