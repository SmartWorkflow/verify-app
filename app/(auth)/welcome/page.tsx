import Link from 'next/link';

export default function WelcomePage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50 px-4">
      <div className="w-full max-w-2xl text-center">
        <div className="bg-white p-12 rounded-2xl shadow-lg">
          {/* Success Icon */}
          <div className="mb-6 flex justify-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center">
              <svg
                className="w-10 h-10 text-emerald-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
          </div>

          {/* Welcome Message */}
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome to Verifiey! 🎉
          </h1>
          <p className="text-lg text-gray-600 mb-8">
            Your account has been created successfully. We&apos;re excited to have you on board!
          </p>

          {/* Features List */}
          <div className="mb-8 text-left max-w-md mx-auto">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">What&apos;s next?</h2>
            <ul className="space-y-3">
              <li className="flex items-start">
                <svg
                  className="w-6 h-6 text-emerald-500 mr-3 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-gray-700">Sign in to access your dashboard</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-6 h-6 text-emerald-500 mr-3 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-gray-700">Explore phone number verification features</span>
              </li>
              <li className="flex items-start">
                <svg
                  className="w-6 h-6 text-emerald-500 mr-3 shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <span className="text-gray-700">Start sending SMS messages</span>
              </li>
            </ul>
          </div>

          {/* Login Button */}
          <Link
            href="/login"
            className="inline-block px-8 py-3 text-white font-medium rounded-lg transition-all transform hover:scale-105 hover:shadow-lg"
            style={{ backgroundColor: '#1dd1a1' }}
          >
            Sign In to Your Account
          </Link>
        </div>

        {/* Additional Help Link */}
        <div className="mt-6">
          <Link href="/" className="text-sm text-gray-600 hover:text-gray-900">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
