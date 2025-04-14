import Image from 'next/image';

const BrandIcon = () => {
    return (
        <Image
            src="/icon-transparent.png"
            alt="MCP Hub Icon"
            width={128}
            height={128}
            className="bg-transparent"
        />
    );
};

export default BrandIcon;