import React from 'react';
import { Link } from 'react-router-dom';
import { UserPlus, ArrowRight, User, Mail, Hash, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';

export const Register: React.FC = () => {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // No backend integration or state management in this step as per requirements
  };

  return (
    <div className="flex-1 flex items-center justify-center p-4 sm:p-6 lg:p-8 py-10">
      <div className="w-full max-w-2xl space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-1 ring-primary/30 mb-2 shadow-sm">
            <UserPlus className="h-6 w-6" />
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-slate-900">Create Your Account</h2>
          <p className="text-sm text-slate-600">
            Join AutoMacha to automate your campus workflows
          </p>
        </div>

        <Card className="border-slate-200/80 shadow-2xl bg-white/95 backdrop-blur-2xl">
          <CardHeader className="space-y-1 pb-4">
            <CardTitle className="text-xl font-bold text-slate-900">Student Registration</CardTitle>
            <CardDescription className="text-slate-600">
              Enter your official institute details below to register.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Full Name (maps to backend username attribute) */}
                <div className="space-y-2">
                  <Label htmlFor="username" className="text-slate-700 font-medium">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="username"
                      name="username"
                      type="text"
                      placeholder="e.g. Duvva Sai Vivek"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                {/* Institute Email */}
                <div className="space-y-2">
                  <Label htmlFor="institute_email" className="text-slate-700 font-medium">Institute Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="institute_email"
                      name="institute_email"
                      type="email"
                      placeholder="e.g. 124AD0048@iiitk.ac.in"
                      pattern=".+@iiitk\.ac\.in"
                      title="Please enter your valid @iiitk.ac.in institute email address"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                {/* Roll Number */}
                <div className="space-y-2">
                  <Label htmlFor="roll_number" className="text-slate-700 font-medium">Roll Number</Label>
                  <div className="relative">
                    <Hash className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                    <Input
                      id="roll_number"
                      name="roll_number"
                      type="text"
                      placeholder="e.g. 124AD0048"
                      className="pl-9"
                      required
                    />
                  </div>
                </div>

                {/* Course (maps to backend 'branch' attribute) */}
                <div className="space-y-2">
                  <Label htmlFor="course" className="text-slate-700 font-medium">Course</Label>
                  <select
                    id="course"
                    name="branch"
                    className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-slate-900 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary/50 transition-all duration-200 shadow-sm"
                    required
                    defaultValue=""
                  >
                    <option value="" disabled className="text-slate-400">Select Course</option>
                    <option value="B.Tech">B.Tech</option>
                    <option value="M.Tech">M.Tech</option>
                    <option value="PhD">PhD</option>
                    <option value="Post Doc.">Post Doc.</option>
                    <option value="Project Assistants">Project Assistants</option>
                    <option value="Interns">Interns</option>
                  </select>
                </div>

                {/* Hostel */}
                <div className="space-y-2">
                  <Label htmlFor="hostel" className="text-slate-700 font-medium">Hostel</Label>
                  <select
                    id="hostel"
                    name="hostel"
                    className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-slate-900 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary/50 transition-all duration-200 shadow-sm"
                    required
                    defaultValue=""
                  >
                    <option value="" disabled className="text-slate-400">Select Hall of Residence</option>
                    <option value="Kalam Hall Of Residence">Kalam Hall Of Residence</option>
                    <option value="Kalpana Chawla Hall Of Residence">Kalpana Chawla Hall Of Residence</option>
                    <option value="MVHR">MVHR</option>
                    <option value="SRKH">SRKH</option>
                  </select>
                </div>

                {/* Gender */}
                <div className="space-y-2">
                  <Label htmlFor="gender" className="text-slate-700 font-medium">Gender</Label>
                  <select
                    id="gender"
                    name="gender"
                    className="flex h-10 w-full rounded-md border border-input bg-white px-3 py-2 text-sm text-slate-900 ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:border-primary/50 transition-all duration-200 shadow-sm"
                    required
                    defaultValue=""
                  >
                    <option value="" disabled className="text-slate-400">Select Gender</option>
                    <option value="M">Male</option>
                    <option value="F">Female</option>
                    <option value="O">Other</option>
                  </select>
                </div>
              </div>

              {/* Password */}
              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    id="password"
                    name="password"
                    type="password"
                    placeholder="Create a strong password (min. 8 characters)"
                    className="pl-9"
                    required
                  />
                </div>
              </div>

              <Button type="submit" className="w-full gap-2 font-semibold text-base shadow-lg shadow-primary/20">
                <span>Register Account</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
          <CardFooter className="flex justify-center border-t border-slate-100 pt-4 pb-6">
            <p className="text-sm text-slate-600">
              Already have an account?{' '}
              <Link to="/login" className="font-semibold text-primary hover:underline">
                Login here
              </Link>
            </p>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};
