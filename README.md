# Stakely Mini App 🎯

> Put your money where your mouth is. Prove yourself on-chain and dominate the leaderboard.

A competitive staking mini app built for the Farcaster ecosystem where users can stake, compete, and climb leaderboards to prove their on-chain prowess.

## 🚀 Features

- **Competitive Staking**: Challenge yourself and others by putting your money on the line
- **Leaderboards**: Track your performance and compete with other users
- **Multi-Chain Support**: Works with both Ethereum and Solana blockchains
- **Farcaster Integration**: Native integration with Farcaster social protocol
- **Real-time Updates**: Live leaderboard updates and notifications
- **Wallet Connect**: Seamless wallet integration for both EVM and Solana wallets

## 🛠 Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: TypeScript
- **Frontend**: React 18 with Tailwind CSS
- **Blockchain**: Ethereum + Solana support via Wagmi & Solana wallet adapters
- **Farcaster**: @farcaster/miniapp-core, @neynar/react SDK
- **Deployment**: Vercel
- **Database**: Vercel KV (Redis)

## 📱 Live Demo

🌐 **Production**: [https://stakely-miniapp.vercel.app](https://stakely-miniapp.vercel.app)

## 🏃‍♂️ Quick Start

### Prerequisites

- Node.js 18+ 
- npm or yarn package manager
- A Farcaster account (for full functionality)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/16navigabraham/stakely-miniapp.git
   cd stakely-miniapp
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env.local
   ```
   
   Configure the following variables in `.env.local`:
   ```env
   # App Configuration
   NEXT_PUBLIC_URL=http://localhost:3000
   
   # Neynar API (for Farcaster integration)
   NEYNAR_API_KEY=your_neynar_api_key
   NEYNAR_CLIENT_ID=your_neynar_client_id
   
   # Farcaster Account Association (get from developer portal)
   FARCASTER_ACCOUNT_ASSOCIATION_HEADER=your_header
   FARCASTER_ACCOUNT_ASSOCIATION_PAYLOAD=your_payload
   FARCASTER_ACCOUNT_ASSOCIATION_SIGNATURE=your_signature
   
   # Database (Vercel KV)
   KV_REST_API_TOKEN=your_kv_token
   KV_REST_API_URL=your_kv_url
   ```

4. **Run the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🔧 Configuration

### Farcaster Account Association

To enable full Farcaster functionality:

1. Deploy your app to get a live domain
2. Visit [Farcaster Developer Portal](https://farcaster.xyz/~/developers/mini-apps/manifest)
3. Enter your domain and sign the manifest
4. Copy the generated account association values to your `.env.local`

### Customization

Key configuration files:
- `src/lib/constants.ts` - App constants and branding
- `tailwind.config.ts` - Theme and styling
- `src/app/globals.css` - Global styles

## 📁 Project Structure

```
stakely-miniapp/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── api/               # API endpoints
│   │   ├── .well-known/       # Farcaster manifest
│   │   └── share/             # Dynamic share pages
│   ├── components/            # React components
│   │   ├── ui/               # UI components (tabs, buttons, etc.)
│   │   └── providers/        # Context providers
│   ├── hooks/                # Custom React hooks
│   └── lib/                  # Utilities and configurations
├── public/                   # Static assets
├── scripts/                  # Build and deployment scripts
└── docs/                     # Documentation
```

## 🚀 Deployment

### Deploy to Vercel

1. **Using the deployment script (recommended)**
   ```bash
   npm run deploy:vercel
   ```

2. **Manual deployment**
   - Connect your GitHub repository to Vercel
   - Configure environment variables in Vercel dashboard
   - Deploy automatically on git push

### Environment Variables for Production

Make sure to set these in your Vercel dashboard:
- `NEXT_PUBLIC_URL` - Your production domain
- `NEYNAR_API_KEY` - Your Neynar API key
- `NEYNAR_CLIENT_ID` - Your Neynar client ID
- `FARCASTER_ACCOUNT_ASSOCIATION_*` - Your signed manifest data
- `KV_REST_API_TOKEN` & `KV_REST_API_URL` - Vercel KV credentials

## 🎮 Usage

### For Users

1. **Make a Challenge**: Set your stake amount and create a challenge
2. **Compete**: Participate in existing challenges and climb the leaderboard
3. **Track Progress**: Monitor your performance and earnings

### For Developers

#### Adding New Features

1. Create components in `src/components/`
2. Add API endpoints in `src/app/api/`
3. Update constants in `src/lib/constants.ts`
4. Test locally with `npm run dev`

#### Customizing Appearance

- Update `src/lib/constants.ts` for branding
- Modify `tailwind.config.ts` for theme colors
- Edit components in `src/components/ui/`

## 🔗 API Reference

### Farcaster Manifest
- `GET /.well-known/farcaster.json` - Returns the Farcaster manifest

### User Management
- `GET /api/users` - Get user data
- `POST /api/auth/validate` - Validate Farcaster authentication

### Notifications
- `POST /api/send-notification` - Send push notifications to users

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Neynar Docs](https://docs.neynar.com)
- **Issues**: [GitHub Issues](https://github.com/16navigabraham/stakely-miniapp/issues)
- **Farcaster**: [@stakely](https://warpcast.com/stakely) on Warpcast

## 🙏 Acknowledgments

- Built with [Neynar's Farcaster Mini App template](https://github.com/neynarxyz/farcaster-miniapp-starter)
- Powered by [Farcaster Protocol](https://farcaster.xyz)
- Deployed on [Vercel](https://vercel.com)

---

**Ready to stake your reputation?** [Launch the app](https://stakely-miniapp.vercel.app) and start competing! 🏆

