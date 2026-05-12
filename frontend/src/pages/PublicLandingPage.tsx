//frontend/src/pages/PublicLandingPage.tsx
import { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import { Card, CardContent } from "../components/ui/card";
import {
  FileText,
  ArrowRight,
  MessageSquare,
  Users,
  Shield,
  Code2,
} from "lucide-react";
import api from "../api/axios";

interface DeveloperProfile {
  developer_id?: number;
  full_name: string;
  headline?: string;
  avatar_url?: string;
}

const DEFAULT_DEVELOPER: DeveloperProfile = {
  developer_id: 0,
  full_name: "Kyle Aaron Rana",
  headline: "Backend & Frontend Developer",
  avatar_url: "/developer-avatar-1.jpg",
};

const SECOND_DEVELOPER: DeveloperProfile = {
  developer_id: 1,
  full_name: "Jesie Jim S. Masuangat",
  headline: "UI UX Designer & Frontend Developer",
  avatar_url: "/developer-avatar-2.jpg",
};

const PublicLandingPage = () => {
  const [developers, setDevelopers] = useState<DeveloperProfile[]>([]);
  const [loadingDevs, setLoadingDevs] = useState(true);

  useEffect(() => {
    const fetchDevelopers = async () => {
      try {
        setLoadingDevs(true);
        const response = await api.get("/developers");
        let data = response.data || [];

        if (data.length === 0) {
          data = [DEFAULT_DEVELOPER, SECOND_DEVELOPER];
        }

        setDevelopers(data);
      } catch (err) {
        console.error("Error fetching developers:", err);
        setDevelopers([DEFAULT_DEVELOPER, SECOND_DEVELOPER]);
      } finally {
        setLoadingDevs(false);
      }
    };

    fetchDevelopers();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-slate-100/50 pt-6 pb-8 px-4 font-sans flex flex-col">
      <div className="max-w-5xl mx-auto space-y-12 flex-1">
        {/* Header Section */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center bg-white rounded-2xl shadow-sm mb-2 border border-slate-100"></div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-slate-900 tracking-tight">
            CIT Asset Management
          </h1>
          <p className="text-lg text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Streamline your laboratory experience. Access forms, report issues,
            and manage resources all in one place.
          </p>
        </div>

        {/* Main Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          <Card className="rounded-3xl border-slate-100/60 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start mb-6 gap-4">
                <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                  <FileText className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-1">
                    Submit Forms
                  </h2>
                  <p className="text-slate-500 leading-relaxed text-sm">
                    Request new software installations or specific laboratory
                    configurations for your classes.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => (window.location.href = "/public-forms")}
                variant="outline"
                className="w-full h-11 rounded-xl text-sm font-medium border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-blue-700 transition-colors group"
              >
                Go to Forms
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-100/60 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start mb-6 gap-4">
                <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                  <MessageSquare className="w-6 h-6 text-orange-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-1">
                    Submit Complaint
                  </h2>
                  <p className="text-slate-500 leading-relaxed text-sm">
                    Help us maintain our facilities by reporting faulty
                    equipment, software bugs, or network issues.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => (window.location.href = "/public-complaints")}
                variant="outline"
                className="w-full h-11 rounded-xl text-sm font-medium border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-orange-700 transition-colors group"
              >
                File a Report
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-100/60 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-start mb-6 gap-4">
                <div className="w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                  <Users className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-1">
                    CIT Lab Users
                  </h2>
                  <p className="text-slate-500 leading-relaxed text-sm">
                    Exclusive portal for CIT Students & Faculty to seamlessly
                    log laboratory and workstation usage.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => (window.location.href = "/cit-lab-users")}
                variant="outline"
                className="w-full h-11 rounded-xl text-sm font-medium border-slate-200 text-slate-700 hover:bg-slate-50 hover:text-purple-700 transition-colors group"
              >
                Log Usage
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>

          <Card className="rounded-3xl border-slate-100/60 bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-xl hover:shadow-slate-200/50 hover:-translate-y-1 transition-all duration-300 overflow-hidden bg-gradient-to-br from-white to-slate-50">
            <CardContent className="p-6">
              <div className="flex items-start mb-6 gap-4">
                <div className="w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center shrink-0 shadow-inner">
                  <Shield className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-800 mb-1">
                    Staff Portal
                  </h2>
                  <p className="text-slate-500 leading-relaxed text-sm">
                    Secure administrative access for laboratory custodians,
                    technical staff, and system administrators.
                  </p>
                </div>
              </div>
              <Button
                onClick={() => (window.location.href = "/login")}
                className="w-full h-11 rounded-xl text-sm font-medium bg-slate-900 text-white hover:bg-slate-800 hover:shadow-md transition-all group"
              >
                Secure Login
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Developer Team Section */}
        <div className="pt">
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center p-3 bg-indigo-50 rounded-full mb-4">
              <Code2 className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-3xl font-bold text-slate-900 mb-3">
              Developer Team
            </h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto">
              Meet the dedicated individuals who built and maintain this
              platform.
            </p>
          </div>

          {!loadingDevs && developers.length > 0 ? (
            <div className="flex flex-wrap justify-center gap-8 lg:gap-12">
              {developers.map((dev) => (
                <div
                  key={dev.developer_id}
                  className="bg-white/80 backdrop-blur-sm border border-slate-100 p-8 rounded-3xl shadow-sm hover:shadow-lg hover:shadow-slate-200/40 transition-all duration-300 text-center w-full max-w-[300px] group"
                >
                  {dev.avatar_url && (
                    <div className="mb-6 flex justify-center">
                      <div className="w-32 h-32 rounded-full overflow-hidden ring-4 ring-white shadow-md group-hover:scale-105 transition-transform duration-500 bg-slate-100">
                        <img
                          src={dev.avatar_url}
                          alt={dev.full_name}
                          className="w-full h-full object-cover"
                          onError={(e) => {
                            // Fallback if image fails to load
                            (e.target as HTMLImageElement).src =
                              "https://ui-avatars.com/api/?name=" +
                              encodeURIComponent(dev.full_name) +
                              "&background=e2e8f0&color=475569";
                          }}
                        />
                      </div>
                    </div>
                  )}
                  <h3 className="text-xl font-bold text-slate-800">
                    {dev.full_name}
                  </h3>
                  {dev.headline && (
                    <p className="text-sm text-indigo-600/80 font-medium mt-2">
                      {dev.headline}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white/50 backdrop-blur-sm rounded-3xl border border-slate-100 shadow-sm max-w-lg mx-auto">
              <div className="animate-pulse flex flex-col items-center">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mb-4"></div>
                <p className="text-slate-500 font-medium">
                  Loading developer profiles...
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer - Pinned to Bottom */}
      <div className="mt-auto border-t border-slate-200/60 pt-16 pb-2 relative">
        <div className="text-center">
          <p className="text-slate-500 font-medium">
            &copy; 2026 College of Information Technology Asset Management. All
            rights reserved.
          </p>
          <p className="text-slate-400 text-sm mt-1">Beta Testing V1.0.0</p>
        </div>
      </div>
    </div>
  );
};

export default PublicLandingPage;
