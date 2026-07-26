import React from 'react';
import { LayoutDashboard } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/hooks';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 py-10">
      <div className="w-full max-w-4xl space-y-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-neutral-200 pb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-black text-white flex items-center justify-center shadow-md">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-black">Dashboard</h1>
            </div>
          </div>
        </div>

        <Card className="border-neutral-200 shadow-xl bg-white">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl font-bold text-black">Student Profile</CardTitle>
          </CardHeader>
          <CardContent className="text-center py-8 border-t border-neutral-100 bg-neutral-50/50 rounded-b-xl">
            <div className="max-w-lg mx-auto space-y-4">
              {user ? (
                <div className="p-4 rounded-lg border border-neutral-200 bg-white shadow-sm text-left flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-black text-white flex items-center justify-center shrink-0 font-bold uppercase">
                    {user.username.slice(0, 2)}
                  </div>
                  <div>
                    <p className="font-bold text-black">{user.username}</p>
                    <p className="text-xs text-neutral-500">
                      {user.institute_email} • {user.branch || 'Student'} • {user.hostel || 'Campus'}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg border border-neutral-200 bg-white shadow-sm text-left flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-black text-white flex items-center justify-center shrink-0 font-bold">
                    AM
                  </div>
                  <div>
                    <p className="font-bold text-black">Authenticated User</p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
