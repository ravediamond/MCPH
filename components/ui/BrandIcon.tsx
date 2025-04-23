import Image from 'next/image';

const BrandIcon = () => {
    return (
        <div className="relative flex items-center">
            <Image
                src="/icon.png"
                alt="MCP Hub Icon"
                width={42}
                height={42}
                className="bg-transparent"
                priority
            />
            <span className="ml-2 font-bold text-xl text-white">MCPRegistry</span>
        </div>
    );
};

export default BrandIcon;