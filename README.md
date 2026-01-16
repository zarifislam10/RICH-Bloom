# RICH Goal Tracker

A modern web application for setting and tracking goals based on the RICH principles (I Matter, Responsibility, Considerate, Strategies). Users can create goals, track their progress, and write reflections when goals are completed.

## Features

- 🔐 **Authentication**: Secure login with Supabase Auth
- 🎯 **Goal Creation**: Set goals based on RICH principles
- 📊 **Progress Tracking**: Update goal progress with a visual slider
- ✍️ **Reflections**: Write reflections when goals reach 100%
- 🎨 **Modern UI**: Beautiful, responsive design with Tailwind CSS
- 🔒 **Protected Routes**: Secure access to user-specific content

## RICH Principles

1. **I Matter**: Setting goals that help you value yourself and build confidence
2. **Responsibility**: Taking ownership of your actions and commitments
3. **Considerate**: Being thoughtful and kind in your interactions with others
4. **Strategies**: Developing smart approaches to reach your goals

## Tech Stack

- **Frontend**: Next.js 15, React 19, TypeScript
- **Styling**: Tailwind CSS, shadcn/ui components
- **Backend**: Supabase (PostgreSQL, Auth, Row Level Security)
- **Deployment**: Vercel (recommended)

## Getting Started

### Prerequisites

- Node.js 18+ 
- pnpm (recommended) or npm
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd richgoaltracker
   ```

2. **Install dependencies**
   ```bash
   pnpm install
   ```

3. **Set up Supabase**
   - Create a new Supabase project
   - Get your project URL and anon key
   - Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Set up the database**
   - Run the SQL script in `scripts/create-goals-and-reflections-tables.sql` in your Supabase SQL editor
   - This creates the necessary tables with Row Level Security policies

5. **Start the development server**
   ```bash
   pnpm dev
   ```

6. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Database Schema

### Goals Table
```sql
CREATE TABLE goal (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_text TEXT NOT NULL,
  principle TEXT NOT NULL,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Reflections Table
```sql
CREATE TABLE reflections (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  goal_id UUID REFERENCES goal(id) ON DELETE CASCADE,
  principle TEXT NOT NULL,
  reflection_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

## Project Structure

```
richgoaltracker/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── goals/             # Goals list page
│   ├── login/             # Login page
│   └── page.tsx           # Main goal creation page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── auth.tsx          # Authentication component
│   ├── goal-card.tsx     # Individual goal display
│   ├── navigation.tsx    # Navigation bar
│   ├── reflection-modal.tsx # Reflection writing modal
│   └── write-reflection-button.tsx # Reflection button
├── contexts/             # React contexts
│   └── auth-context.tsx  # Authentication context
├── lib/                  # Utility libraries
│   ├── supabase.ts       # Supabase client
│   └── utils.ts          # Utility functions
└── scripts/              # Database scripts
    └── create-goals-and-reflections-tables.sql
```

## Usage

1. **Sign Up/Login**: Create an account or sign in with your email
2. **Create Goals**: Select a RICH principle and write your goal
3. **Track Progress**: Update your goal progress using the slider
4. **Write Reflections**: When a goal reaches 100%, write a reflection
5. **View History**: Browse your goals and reflections in the goals page

## Future Features

- 📚 **Google Classroom Integration**: Link assignments to goals
- 📈 **Analytics Dashboard**: View progress over time
- 🤝 **Social Features**: Share goals with friends
- 📱 **Mobile App**: Native mobile application
- 🔔 **Notifications**: Reminders for goal updates

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

If you have any questions or need help, please open an issue on GitHub or contact the development team. 