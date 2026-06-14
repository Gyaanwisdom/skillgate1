
-- Enums
CREATE TYPE public.app_role AS ENUM ('admin', 'artisan', 'customer');
CREATE TYPE public.booking_status AS ENUM ('pending', 'accepted', 'in_progress', 'completed', 'cancelled');
CREATE TYPE public.registration_status AS ENUM ('pending', 'approved', 'rejected');

-- Profiles
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL DEFAULT '',
  phone TEXT,
  avatar_url TEXT,
  city TEXT DEFAULT 'Redemption City',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_own_update" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id);
CREATE POLICY "profiles_own_insert" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);

-- User roles
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "roles_own_read" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

-- Auto-create profile + customer role on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email,'@',1)), NEW.raw_user_meta_data->>'avatar_url')
  ON CONFLICT (id) DO NOTHING;
  INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'customer') ON CONFLICT DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Categories
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  description TEXT
);
GRANT SELECT ON public.categories TO anon, authenticated;
GRANT ALL ON public.categories TO service_role;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "categories_public_read" ON public.categories FOR SELECT USING (true);

INSERT INTO public.categories (slug, name, icon, description) VALUES
  ('electrician','Electricians','bolt','Wiring, fans, sockets, installations'),
  ('plumber','Plumbers','plumbing','Pipes, leaks, water systems'),
  ('carpenter','Carpenters','handyman','Furniture, doors, repairs'),
  ('tailor','Tailors','content_cut','Custom clothing & alterations'),
  ('mechanic','Mechanics','build','Auto repair & maintenance'),
  ('cleaner','Cleaners','cleaning_services','Home & office cleaning'),
  ('painter','Painters','format_paint','Interior & exterior painting'),
  ('hairstylist','Hairstylists','content_cut','Hair, braids & grooming');

-- Artisans
CREATE TABLE public.artisans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  profile_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  avatar_url TEXT,
  category_slug TEXT NOT NULL REFERENCES public.categories(slug),
  bio TEXT,
  hourly_rate INTEGER NOT NULL DEFAULT 5000,
  years_experience INTEGER NOT NULL DEFAULT 1,
  rating NUMERIC(2,1) NOT NULL DEFAULT 4.5,
  completed_jobs INTEGER NOT NULL DEFAULT 0,
  available BOOLEAN NOT NULL DEFAULT true,
  location TEXT DEFAULT 'Redemption City',
  skills TEXT[] DEFAULT '{}',
  verified BOOLEAN NOT NULL DEFAULT true,
  is_seed BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.artisans TO anon, authenticated;
GRANT INSERT, UPDATE ON public.artisans TO authenticated;
GRANT ALL ON public.artisans TO service_role;
ALTER TABLE public.artisans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "artisans_public_read" ON public.artisans FOR SELECT USING (true);
CREATE POLICY "artisans_admin_write" ON public.artisans FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- Seed 5 demo artisans per category
INSERT INTO public.artisans (full_name, category_slug, bio, hourly_rate, years_experience, rating, completed_jobs, skills, avatar_url, is_seed) VALUES
  ('Tunde Adebayo','electrician','Master electrician specializing in residential wiring',6500,12,4.9,234,ARRAY['Wiring','Fan Installation','Sockets'],'https://i.pravatar.cc/200?u=1',true),
  ('Chioma Okeke','electrician','Solar & inverter installation expert',8000,8,4.8,156,ARRAY['Solar','Inverter','Generators'],'https://i.pravatar.cc/200?u=2',true),
  ('Musa Bello','electrician','Affordable & reliable repairs',4500,5,4.6,98,ARRAY['Repairs','Lighting'],'https://i.pravatar.cc/200?u=3',true),
  ('Grace Okon','electrician','Industrial & commercial electrician',9500,15,5.0,312,ARRAY['Industrial','Commercial'],'https://i.pravatar.cc/200?u=4',true),
  ('Femi Adeyemi','electrician','Emergency electrical services',7000,6,4.7,142,ARRAY['Emergency','Diagnostics'],'https://i.pravatar.cc/200?u=5',true),
  ('Ibrahim Sani','plumber','Pipe & leak specialist',5500,10,4.8,201,ARRAY['Leaks','Pipes','Toilets'],'https://i.pravatar.cc/200?u=6',true),
  ('Blessing Eze','plumber','Bathroom remodeling',7500,7,4.9,178,ARRAY['Bathroom','Tiles'],'https://i.pravatar.cc/200?u=7',true),
  ('Yusuf Garba','plumber','Water heater & pump installation',6000,9,4.7,165,ARRAY['Heaters','Pumps'],'https://i.pravatar.cc/200?u=8',true),
  ('Adaeze Nwosu','plumber','24/7 emergency plumber',5000,4,4.5,87,ARRAY['Emergency'],'https://i.pravatar.cc/200?u=9',true),
  ('Kola Williams','plumber','Commercial plumbing',8500,13,4.9,256,ARRAY['Commercial'],'https://i.pravatar.cc/200?u=10',true),
  ('Emeka Obi','carpenter','Custom furniture maker',6000,11,4.9,189,ARRAY['Furniture','Doors'],'https://i.pravatar.cc/200?u=11',true),
  ('Hauwa Aliyu','carpenter','Kitchen cabinet specialist',7000,8,4.8,143,ARRAY['Cabinets','Kitchens'],'https://i.pravatar.cc/200?u=12',true),
  ('Segun Akin','carpenter','Roofing & framing',5500,6,4.6,112,ARRAY['Roofing','Framing'],'https://i.pravatar.cc/200?u=13',true),
  ('Ngozi Eze','carpenter','Wardrobe & shelving',5000,5,4.7,95,ARRAY['Wardrobes'],'https://i.pravatar.cc/200?u=14',true),
  ('Bola Ojo','carpenter','Door & window repair',4500,7,4.5,124,ARRAY['Doors','Windows'],'https://i.pravatar.cc/200?u=15',true),
  ('Aisha Mohammed','tailor','Native & traditional wear',4000,12,4.9,267,ARRAY['Native','Traditional'],'https://i.pravatar.cc/200?u=16',true),
  ('Folake Adeniyi','tailor','Bridal & wedding gowns',8000,9,5.0,189,ARRAY['Bridal','Gowns'],'https://i.pravatar.cc/200?u=17',true),
  ('Sani Idris','tailor','Men''s suits & shirts',5500,7,4.7,154,ARRAY['Suits','Shirts'],'https://i.pravatar.cc/200?u=18',true),
  ('Patience Udo','tailor','Quick alterations',3000,4,4.6,212,ARRAY['Alterations'],'https://i.pravatar.cc/200?u=19',true),
  ('Halima Bello','tailor','Fashion designer',6500,8,4.8,176,ARRAY['Design','Custom'],'https://i.pravatar.cc/200?u=20',true),
  ('Chuks Anya','mechanic','Toyota & Honda specialist',6000,14,4.9,298,ARRAY['Toyota','Honda'],'https://i.pravatar.cc/200?u=21',true),
  ('Bashir Lawal','mechanic','Diesel engine expert',7500,11,4.8,210,ARRAY['Diesel'],'https://i.pravatar.cc/200?u=22',true),
  ('Ifeanyi Onu','mechanic','Mobile mechanic',5500,6,4.6,134,ARRAY['Mobile','Emergency'],'https://i.pravatar.cc/200?u=23',true),
  ('Tobi Adekunle','mechanic','Electrical & diagnostics',6500,9,4.7,167,ARRAY['Diagnostics','Electrical'],'https://i.pravatar.cc/200?u=24',true),
  ('Suleiman Musa','mechanic','Bodywork & paint',5000,7,4.5,98,ARRAY['Body','Paint'],'https://i.pravatar.cc/200?u=25',true),
  ('Mary Effiong','cleaner','Deep house cleaning',3500,5,4.8,287,ARRAY['Deep Clean'],'https://i.pravatar.cc/200?u=26',true),
  ('Joy Akpan','cleaner','Post-construction cleaning',4500,4,4.7,156,ARRAY['Construction'],'https://i.pravatar.cc/200?u=27',true),
  ('Esther Ojo','cleaner','Office cleaning',3000,6,4.6,234,ARRAY['Office'],'https://i.pravatar.cc/200?u=28',true),
  ('Rachael Bassey','cleaner','Move in/out cleaning',4000,3,4.5,89,ARRAY['Moving'],'https://i.pravatar.cc/200?u=29',true),
  ('Helen Iwu','cleaner','Eco-friendly cleaning',4500,5,4.9,178,ARRAY['Eco'],'https://i.pravatar.cc/200?u=30',true),
  ('David Eze','painter','Interior wall painting',4500,8,4.8,201,ARRAY['Interior'],'https://i.pravatar.cc/200?u=31',true),
  ('Samuel Okoro','painter','Exterior & industrial',6000,11,4.9,234,ARRAY['Exterior','Industrial'],'https://i.pravatar.cc/200?u=32',true),
  ('Peter John','painter','Decorative & texture',5500,6,4.7,123,ARRAY['Decorative'],'https://i.pravatar.cc/200?u=33',true),
  ('Lateef Aremu','painter','Spray painting expert',5000,7,4.6,145,ARRAY['Spray'],'https://i.pravatar.cc/200?u=34',true),
  ('Chinedu Obi','painter','Waterproof & roof coating',6500,9,4.8,167,ARRAY['Waterproof'],'https://i.pravatar.cc/200?u=35',true),
  ('Funmi Bakare','hairstylist','Bridal & special occasion',5000,8,4.9,278,ARRAY['Bridal','Updos'],'https://i.pravatar.cc/200?u=36',true),
  ('Amaka Eze','hairstylist','Braids & natural hair',3500,6,4.8,234,ARRAY['Braids','Natural'],'https://i.pravatar.cc/200?u=37',true),
  ('Tope Oladele','hairstylist','Men''s grooming & barber',2500,5,4.7,312,ARRAY['Barber','Mens'],'https://i.pravatar.cc/200?u=38',true),
  ('Sarah Inyang','hairstylist','Color & treatments',4500,7,4.8,189,ARRAY['Color'],'https://i.pravatar.cc/200?u=39',true),
  ('Linda Okafor','hairstylist','Wigs & extensions',5500,4,4.6,145,ARRAY['Wigs','Extensions'],'https://i.pravatar.cc/200?u=40',true);

-- Bookings
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  artisan_id UUID NOT NULL REFERENCES public.artisans(id),
  scheduled_at TIMESTAMPTZ NOT NULL,
  description TEXT NOT NULL,
  address TEXT,
  status public.booking_status NOT NULL DEFAULT 'pending',
  price INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.bookings TO authenticated;
GRANT ALL ON public.bookings TO service_role;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "bookings_own_read" ON public.bookings FOR SELECT TO authenticated USING (auth.uid() = customer_id OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "bookings_own_insert" ON public.bookings FOR INSERT TO authenticated WITH CHECK (auth.uid() = customer_id);
CREATE POLICY "bookings_own_update" ON public.bookings FOR UPDATE TO authenticated USING (auth.uid() = customer_id OR public.has_role(auth.uid(),'admin'));

-- Artisan registrations
CREATE TABLE public.artisan_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  applicant_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  category_slug TEXT NOT NULL REFERENCES public.categories(slug),
  years_experience INTEGER NOT NULL DEFAULT 1,
  hourly_rate INTEGER NOT NULL DEFAULT 5000,
  bio TEXT,
  skills TEXT[] DEFAULT '{}',
  location TEXT DEFAULT 'Redemption City',
  status public.registration_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.artisan_registrations TO authenticated;
GRANT SELECT, INSERT ON public.artisan_registrations TO anon;
GRANT ALL ON public.artisan_registrations TO service_role;
ALTER TABLE public.artisan_registrations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "reg_public_insert" ON public.artisan_registrations FOR INSERT WITH CHECK (true);
CREATE POLICY "reg_admin_read" ON public.artisan_registrations FOR SELECT TO authenticated USING (public.has_role(auth.uid(),'admin') OR applicant_user_id = auth.uid());
CREATE POLICY "reg_admin_update" ON public.artisan_registrations FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));