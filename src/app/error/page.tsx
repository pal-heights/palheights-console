import Link from "next/link";
const error = () => {
  return (
    <>
      <section className="relative z-10 py-[120px] bg-gray-200 h-screen flex justify-center items-center">
        <div className="container mx-auto">
          <div className="-mx-4 flex">
            <div className="w-full px-4">
              <div className="mx-auto text-center">
                {/* Gradient 404 */}
                <h2 className="mb-4 text-[60px] sm:text-[90px] md:text-[200px] font-bold leading-none bg-gradient-to-r from-[#c2a063] to-[#b49355] bg-clip-text text-transparent">
                  404
                </h2>

                {/* Darker text, slightly bigger */}
                <h4 className="mb-3 text-[24px] sm:text-[28px] md:text-[32px] font-semibold leading-tight text-gray-900">
                  Oops! That page can’t be found
                </h4>
                <p className="mb-8 text-lg sm:text-xl text-gray-700">
                  Sorry, the page you are looking for doesn’t exist.
                </p>

                {/* Button with gradient hover */}
                <Link
                  href="/"
                  className="
                    inline-block
                    rounded-lg
                    border border-[#b49355]
                    px-8 py-3
                    text-center
                    text-base sm:text-lg
                    font-semibold
                    text-gray-900

                    bg-white
                    transition-all
                    duration-300
                    ease-out

                    hover:text-white
                    hover:border-transparent
                    hover:bg-gradient-to-r
                    hover:from-[#d1a24b]
                    hover:to-[#c2a063]

                    focus-visible:outline-none
                    focus-visible:ring-2
                    focus-visible:ring-[#b49355]
                    focus-visible:ring-offset-2
                  "
                >
                  Go To Home
                </Link>

              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default error;
