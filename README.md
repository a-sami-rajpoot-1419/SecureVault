# SecureVault

A flexible file encryption solution with dual-mode functionality: quick local encryption/decryption for guests, or cloud-based secure file storage and sharing for registered users.

## Features

### Guest Mode (No Login Required)
- ✨ Instant file encryption/decryption locally in your browser
- 🔐 AES-256-GCM encryption standard
- 🚀 No account needed for quick operations
- 🔒 Password-protected encryption

### User Mode (Authenticated)
- ☁️ Secure cloud storage for encrypted files
- 🔗 Share encrypted files via password-protected links
- 📊 Track encryption/decryption history
- 👤 User account with Google OAuth support
- 📁 File management dashboard

## Tech Stack

- **Frontend:** React 18, Vite 6
- **UI Framework:** TailwindCSS, Shadcn/UI (Radix UI)
- **Authentication:** Supabase Auth with Google OAuth
- **Database:** PostgreSQL via Supabase
- **State Management:** React Context, TanStack Query
- **Encryption:** Web Crypto API (AES-256-GCM)

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account (free tier available)

### Installation

1. **Clone the repository**
   ```bash
   git clone git@github-personal:a-sami-rajpoot-1419/SecureVault.git
   cd SecureVault
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```bash
   # Supabase Configuration
   VITE_SUPABASE_URL=your-supabase-project-url
   VITE_SUPABASE_ANON_KEY=your-supabase-anon-key
   ```

   Get these values from your [Supabase Dashboard](https://app.supabase.com):
   - Project Settings → API → Project URL
   - Project Settings → API → Project API keys (anon/public)

4. **Set up Supabase Database**

   Create the encryption_logs table in your Supabase project:
   ```sql
   create table encryption_logs (
     id uuid default gen_random_uuid() primary key,
     user_id uuid references auth.users not null,
     original_filename text not null,
     encrypted_filename text,
     file_type text,
     file_size bigint,
     operation_type text check (operation_type in ('encrypt', 'decrypt')),
     algorithm_used text default 'AES-256-GCM',
     status text check (status in ('pending', 'completed', 'failed')),
     created_at timestamp with time zone default timezone('utc'::text, now()) not null
   );

   -- Enable Row Level Security
   alter table encryption_logs enable row level security;

   -- Policy: Users can only see their own logs
   create policy "Users can view own logs"
     on encryption_logs for select
     using (auth.uid() = user_id);

   create policy "Users can insert own logs"
     on encryption_logs for insert
     with check (auth.uid() = user_id);
   ```

5. **Enable Google OAuth (Optional)**
   
   In Supabase Dashboard:
   - Authentication → Providers → Google
   - Enable Google provider
   - Add your Google OAuth credentials
   - Add authorized redirect URLs: `http://localhost:5173/auth/callback`

6. **Run the development server**
   ```bash
   npm run dev
   ```

   Open [http://localhost:5173](http://localhost:5173) in your browser.

## Project Structure

```
SecureVault/
├── src/
│   ├── api/              # API client (Supabase)
│   ├── components/       # React components
│   │   └── ui/          # Shadcn UI components
│   ├── hooks/           # Custom React hooks
│   ├── libs/            # Core utilities & context
│   ├── lib/             # Shadcn utilities (symlinked)
│   ├── pages/           # Page components
│   ├── utils/           # Helper functions
│   └── App.jsx          # Main app component
├── public/              # Static assets
└── .env.local          # Environment variables (create this)
```

## Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint
- `npm run lint:fix` - Fix ESLint errors

## Security Features

- 🔐 End-to-end encryption with AES-256-GCM
- 🔑 Password-based key derivation (PBKDF2)
- 🛡️ Secure session management via Supabase
- 🔒 Row-level security for database access
- ✅ OAuth 2.0 authentication with Google

## Current Status

✅ **Completed:**
- Authentication system (Email/Password + Google OAuth)
- User registration and login pages
- Protected routes and auth state management
- Dashboard skeleton
- Supabase integration
- UI component library (50+ components)

🚧 **In Progress:**
- File encryption/decryption logic
- File upload and storage
- Encryption history tracking
- File sharing functionality

## Roadmap

- [ ] Client-side file encryption implementation
- [ ] File upload to Supabase Storage
- [ ] Encrypted file sharing with expiry links
- [ ] Two-factor authentication (2FA)
- [ ] File encryption history export
- [ ] Guest mode for quick encryption
- [ ] Mobile responsive improvements
- [ ] Progressive Web App (PWA) support

## Environment Variables

The project requires the following environment variables in `.env.local`:

```bash
# Supabase (Required)
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

**Note:** Your `.env` file contains PostgreSQL connection details for direct database access if needed, but the Supabase client uses the URL and anon key.

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on GitHub.
