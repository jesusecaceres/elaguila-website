"use client";

import Navbar from "@/app/components/Navbar";
import { useSearchParams } from "next/navigation";

export default function ContactPage() {
  const params = useSearchParams();
  const lang = params.get("lang") || "en"; // future-proof bilingual toggle

  return (
    <main className="min-h-screen w-full bg-black text-white">
      {/* NAVBAR */}
      <Navbar />

      <div className="pt-32 pb-20 px-6 max-w-4xl mx-auto">
        {/* HEADER */}
        <h1 className="text-4xl font-bold text-yellow-400 text-center mb-6">
          Contact Us
        </h1>

        <p className="text-center text-gray-300 mb-12">
          Reach out to El Águila for advertising, partnerships, magazine
          submissions, events, or support.
        </p>

        {/* BUSINESS INFO */}
        <div className="bg-neutral-900 p-6 rounded-2xl shadow-lg mb-12 border border-neutral-700">
          <h2 className="text-2xl font-semibold text-yellow-400 mb-4">
            Business Information
          </h2>

          <div className="space-y-3 text-gray-300">
            <p>
              <span className="font-semibold text-white">Email:</span>{" "}
              info@elaguilamedia.com
            </p>

            <p>
              <span className="font-semibold text-white">Phone:</span>{" "}
              (408) 937-1063
            </p>

            <p>
              <span className="font-semibold text-white">Hours:</span> Monday –
              Friday, 9:00 AM – 5:00 PM
            </p>

            <p className="italic text-gray-400">
              * Physical business address will be added soon.
            </p>
          </div>
        </div>

        {/* CONTACT FORM */}
        <div className="bg-neutral-900 p-8 rounded-2xl shadow-lg border border-neutral-700">
          <h2 className="text-2xl font-semibold text-yellow-400 mb-6">
            Send Us a Message
          </h2>

          <form className="space-y-6">
            {/* NAME */}
            <div>
              <label className="block mb-1 text-gray-300">Full Name</label>
              <input
                type="text"
                className="w-full p-3 rounded-lg bg-black border border-neutral-700 text-white focus:outline-none focus:border-yellow-400"
                placeholder="Your name"
              />
            </div>

            {/* EMAIL */}
            <div>
              <label className="block mb-1 text-gray-300">Email</label>
              <input
                type="email"
                className="w-full p-3 rounded-lg bg-black border border-neutral-700 text-white focus:outline-none focus:border-yellow-400"
                placeholder="you@example.com"
              />
            </div>

            {/* MESSAGE */}
            <div>
              <label className="block mb-1 text-gray-300">Message</label>
              <textarea
                rows={5}
                className="w-full p-3 rounded-lg bg-black border border-neutral-700 text-white focus:outline-none focus:border-yellow-400"
                placeholder="Write your message here"
              ></textarea>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              className="
                w-full py-3 rounded-lg text-lg font-semibold
                bg-gradient-to-r from-yellow-500 to-yellow-700
                text-black shadow-lg hover:opacity-90 transition
              "
            >
              Send Message
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
