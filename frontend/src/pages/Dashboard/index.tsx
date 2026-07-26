import React from 'react';
import { Link } from 'react-router-dom';
import { LayoutDashboard, LogOut, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export const Dashboard: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 lg:p-8 py-10">
      <div className="w-full max-w-4xl space-y-8">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-neutral-200 pb-6">
          <div className="flex items-center gap-3">
            <div className="h-12 w-12 rounded-xl bg-black text-white flex items-center justify-center shadow-md">
              <LayoutDashboard className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-3xl font-black tracking-tight text-black">Student Portal</h1>
              <p className="text-sm text-neutral-600">AutoMacha Campus Automation Dashboard</p>
            </div>
          </div>

          <Link to="/">
            <Button variant="outline" className="gap-2 font-semibold border-neutral-300 hover:bg-neutral-100 text-black">
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </Button>
          </Link>
        </div>

        {/* Placeholder Content Notice */}
        <Card className="border-neutral-200 shadow-xl bg-white">
          <CardHeader className="text-center pb-4">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-black mb-2 mx-auto ring-1 ring-neutral-200">
              <Sparkles className="h-6 w-6" />
            </div>
            <CardTitle className="text-2xl font-bold text-black">Welcome to Your Dashboard</CardTitle>
            <CardDescription className="text-neutral-600 max-w-md mx-auto">
              You have successfully authenticated into the AutoMacha portal.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center py-8 border-t border-neutral-100 bg-neutral-50/50 rounded-b-xl">
            <div className="max-w-lg mx-auto space-y-4">
              <div className="p-4 rounded-lg border border-neutral-200 bg-white shadow-sm text-left flex items-center gap-4">
                <div className="h-10 w-10 rounded-full bg-black text-white flex items-center justify-center shrink-0 font-bold">
                  SV
                </div>
                <div>
                  <p className="font-bold text-black">Duvva Sai Vivek</p>
                  <p className="text-xs text-neutral-500">124AD0048@iiitk.ac.in • B.Tech • Kalam Hall Of Residence</p>
                </div>
              </div>
              <p className="text-sm text-neutral-500 italic">
                ⏳ Dashboard modules, automation tools, and custom widgets are ready to be configured as per your upcoming instructions!
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
