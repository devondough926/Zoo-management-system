import { MapPin, Phone, Mail, Clock } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gray-900 text-white py-12">
      <div className="container mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8 max-w-3xl mx-auto">
          {/* Contact Information */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-center">
              Contact Information
            </h3>
            <div className="space-y-3">
              <div className="flex items-center space-x-2 justify-center md:justify-start">
                <MapPin className="h-4 w-4" />
                <span className="text-sm">
                  123 Wildlife Drive, Conservation City, ST 12345
                </span>
              </div>
              <div className="flex items-center space-x-2 justify-center md:justify-start">
                <Phone className="h-4 w-4" />
                <span className="text-sm">(555) 123-4567</span>
              </div>
              <div className="flex items-center space-x-2 justify-center md:justify-start">
                <Mail className="h-4 w-4" />
                <span className="text-sm">info@wildwoodzoo.com</span>
              </div>
            </div>
          </div>

          {/* Zoo Hours */}
          <div>
            <h3 className="text-lg font-semibold mb-4 text-center">
              Zoo Hours
            </h3>
            <div className="space-y-2">
              <div className="flex items-center space-x-2 justify-center md:justify-start">
                <Clock className="h-4 w-4" />
                <div className="text-sm">
                  <p>Mon-Fri: 9:00 AM - 6:00 PM</p>
                  <p>Weekends: 8:00 AM - 7:00 PM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
