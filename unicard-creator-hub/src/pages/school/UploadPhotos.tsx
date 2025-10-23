import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { SchoolHeader } from "@/components/SchoolHeader";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useOrder } from "@/hooks/useOrder";
import { ArrowLeft, Upload, CheckCircle, XCircle, Image, User } from "lucide-react";
import JSZip from 'jszip';

interface PhotoMatch {
  filename: string;
  studentId?: string;
  studentName?: string;
  matched: boolean;
  photoFile?: File;
}

const UploadPhotos = () => {
  const navigate = useNavigate();
  const { currentOrder, refreshOrder, isOrderLocked } = useOrder();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [photoMatches, setPhotoMatches] = useState<PhotoMatch[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<string>('');

  if (isOrderLocked) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
        <SchoolHeader />
        <div className="container mx-auto px-4 py-8">
          <Card>
            <CardContent className="p-8 text-center">
              <p className="text-lg text-muted-foreground">
                Order is locked. You cannot upload photos after submission.
              </p>
              <Button onClick={() => navigate('/school/dashboard')} className="mt-4">
                Back to Dashboard
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Fetch students for matching
  useState(() => {
    const fetchStudents = async () => {
      if (!currentOrder) return;

      const { data, error } = await supabase
        .from('students')
        .select('id, student_name, roll_number, student_id')
        .eq('order_id', currentOrder.id);

      if (data && !error) {
        setStudents(data);
      }
    };

    fetchStudents();
  }, [currentOrder]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (!selectedFile.name.toLowerCase().endsWith('.zip')) {
        toast.error('Please select a valid ZIP file');
        return;
      }
      setZipFile(selectedFile);
      processZipFile(selectedFile);
    }
  };

  const processZipFile = async (file: File) => {
    setIsProcessing(true);
    setPhotoMatches([]);

    try {
      const zip = new JSZip();
      const zipContent = await zip.loadAsync(file);
      
      const photoFiles: PhotoMatch[] = [];
      const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'];

      // Extract all image files from ZIP
      for (const [filename, file] of Object.entries(zipContent.files)) {
        if (!file.dir && imageExtensions.some(ext => filename.toLowerCase().endsWith(ext))) {
          const photoFile = await file.async('blob');
          const photoMatch: PhotoMatch = {
            filename: filename.split('/').pop() || filename,
            photoFile: new File([photoFile], filename, { type: photoFile.type }),
            matched: false
          };

          // Try to match by filename
          const matchResult = matchPhotoToStudent(photoMatch.filename);
          if (matchResult) {
            photoMatch.matched = true;
            photoMatch.studentId = matchResult.id;
            photoMatch.studentName = matchResult.student_name;
          }

          photoFiles.push(photoMatch);
        }
      }

      setPhotoMatches(photoFiles);
      toast.success(`Found ${photoFiles.length} photos in ZIP file`);
    } catch (error) {
      console.error('Error processing ZIP:', error);
      toast.error('Failed to process ZIP file');
    } finally {
      setIsProcessing(false);
    }
  };

  const matchPhotoToStudent = (filename: string) => {
    const nameWithoutExt = filename.replace(/\.[^/.]+$/, '').toLowerCase();
    
    // Try to match by roll number
    for (const student of students) {
      if (student.roll_number && nameWithoutExt.includes(student.roll_number.toLowerCase())) {
        return student;
      }
    }

    // Try to match by student ID
    for (const student of students) {
      if (student.student_id && nameWithoutExt.includes(student.student_id.toLowerCase())) {
        return student;
      }
    }

    // Try to match by student name (partial match)
    for (const student of students) {
      const studentName = student.student_name.toLowerCase();
      const nameParts = studentName.split(' ');
      
      // Check if any part of the filename matches any part of the student name
      for (const part of nameParts) {
        if (part.length > 2 && nameWithoutExt.includes(part)) {
          return student;
        }
      }
    }

    return null;
  };

  const handleManualMatch = (photoIndex: number, studentId: string) => {
    const updatedMatches = [...photoMatches];
    const student = students.find(s => s.id === studentId);
    
    if (student) {
      updatedMatches[photoIndex].matched = true;
      updatedMatches[photoIndex].studentId = student.id;
      updatedMatches[photoIndex].studentName = student.student_name;
    }
    
    setPhotoMatches(updatedMatches);
  };

  const handleUpload = async () => {
    if (!currentOrder || photoMatches.length === 0) {
      toast.error('No photos to upload');
      return;
    }

    const matchedPhotos = photoMatches.filter(p => p.matched);
    if (matchedPhotos.length === 0) {
      toast.error('Please match at least one photo to a student');
      return;
    }

    setIsUploading(true);

    try {
      // Upload photos to Supabase storage
      const uploadPromises = matchedPhotos.map(async (photoMatch) => {
        if (!photoMatch.photoFile || !photoMatch.studentId) return;

        const filename = `${currentOrder.id}/${photoMatch.studentId}/${Date.now()}-${photoMatch.filename}`;
        
        const { data, error } = await supabase.storage
          .from('student-photos')
          .upload(filename, photoMatch.photoFile, {
            contentType: photoMatch.photoFile.type,
            upsert: false,
          });

        if (error) {
          console.error('Upload error for', photoMatch.filename, error);
          return null;
        }

        // Get public URL
        const { data: urlData } = supabase.storage
          .from('student-photos')
          .getPublicUrl(filename);

        return {
          studentId: photoMatch.studentId,
          photoUrl: urlData.publicUrl
        };
      });

      const uploadResults = await Promise.all(uploadPromises);
      const successfulUploads = uploadResults.filter(Boolean);

      // Update student records with photo URLs
      const updatePromises = successfulUploads.map(async (result) => {
        if (!result) return;

        const { error } = await supabase
          .from('students')
          .update({ photo_url: result.photoUrl })
          .eq('id', result.studentId);

        if (error) {
          console.error('Error updating student photo:', error);
        }
      });

      await Promise.all(updatePromises);

      toast.success(`Successfully uploaded ${successfulUploads.length} photos!`);
      await refreshOrder();
      navigate('/school/students');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('An error occurred during upload');
    } finally {
      setIsUploading(false);
    }
  };

  const matchedCount = photoMatches.filter(p => p.matched).length;
  const unmatchedCount = photoMatches.length - matchedCount;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20">
      <SchoolHeader />
      
      <main className="container mx-auto px-4 py-8">
        <div className="mb-6">
          <Button variant="ghost" onClick={() => navigate("/school/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* File Upload */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Image className="w-5 h-5" />
                Upload ZIP Photos
              </CardTitle>
              <CardDescription>
                Upload a ZIP file containing student photos. Photos will be automatically matched by filename.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="zip-file">Select ZIP File</Label>
                  <Input
                    id="zip-file"
                    type="file"
                    accept=".zip"
                    onChange={handleFileSelect}
                    ref={fileInputRef}
                    className="mt-2"
                  />
                </div>

                {zipFile && (
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium">Selected File: {zipFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      Size: {(zipFile.size / 1024 / 1024).toFixed(1)} MB
                    </p>
                  </div>
                )}

                {isProcessing && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                    <p className="text-sm text-muted-foreground mt-2">Processing ZIP file...</p>
                  </div>
                )}

                {photoMatches.length > 0 && (
                  <div className="grid grid-cols-2 gap-4 text-center">
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-2xl font-bold text-green-600">{matchedCount}</p>
                      <p className="text-sm text-green-600">Matched</p>
                    </div>
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-2xl font-bold text-yellow-600">{unmatchedCount}</p>
                      <p className="text-sm text-yellow-600">Unmatched</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card>
            <CardHeader>
              <CardTitle>Naming Instructions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-sm">
                <p>For automatic matching, name your photos using:</p>
                <ul className="list-disc list-inside space-y-1 ml-4">
                  <li>Roll number: <code>001.jpg</code></li>
                  <li>Student ID: <code>STU001.jpg</code></li>
                  <li>Student name: <code>john_doe.jpg</code></li>
                  <li>Partial name: <code>john.jpg</code></li>
                </ul>
                <p className="text-muted-foreground">
                  Unmatched photos can be manually assigned below.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Photo Matching Table */}
        {photoMatches.length > 0 && (
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Photo Matching</CardTitle>
              <CardDescription>
                Review and manually assign unmatched photos to students.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="rounded-md border max-h-96 overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Photo</TableHead>
                      <TableHead>Filename</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {photoMatches.map((photo, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          {photo.photoFile && (
                            <img
                              src={URL.createObjectURL(photo.photoFile)}
                              alt={photo.filename}
                              className="w-12 h-12 object-cover rounded"
                            />
                          )}
                        </TableCell>
                        <TableCell className="font-mono text-sm">
                          {photo.filename}
                        </TableCell>
                        <TableCell>
                          {photo.matched ? (
                            <Badge variant="default" className="bg-green-500">
                              <CheckCircle className="w-3 h-3 mr-1" />
                              Matched
                            </Badge>
                          ) : (
                            <Badge variant="secondary">
                              <XCircle className="w-3 h-3 mr-1" />
                              Unmatched
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>
                          {photo.matched ? (
                            <div className="flex items-center gap-2">
                              <User className="w-4 h-4" />
                              <span className="text-sm">{photo.studentName}</span>
                            </div>
                          ) : (
                            <Select
                              value={selectedStudent}
                              onValueChange={(value) => handleManualMatch(index, value)}
                            >
                              <SelectTrigger className="w-48">
                                <SelectValue placeholder="Select student" />
                              </SelectTrigger>
                              <SelectContent>
                                {students.map((student) => (
                                  <SelectItem key={student.id} value={student.id}>
                                    {student.student_name} ({student.roll_number || student.student_id})
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          )}
                        </TableCell>
                        <TableCell>
                          {photo.matched && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                const updated = [...photoMatches];
                                updated[index].matched = false;
                                updated[index].studentId = undefined;
                                updated[index].studentName = undefined;
                                setPhotoMatches(updated);
                              }}
                            >
                              Unmatch
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Upload Button */}
        {photoMatches.length > 0 && matchedCount > 0 && (
          <div className="mt-6 text-center">
            <Button 
              onClick={handleUpload} 
              disabled={isUploading}
              size="lg"
              className="w-full sm:w-auto"
            >
              <Upload className="w-4 h-4 mr-2" />
              {isUploading ? 'Uploading...' : `Upload ${matchedCount} Photos`}
            </Button>
          </div>
        )}

        {students.length === 0 && (
          <Alert className="mt-6">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              No students found. Please add students first before uploading photos.
            </AlertDescription>
          </Alert>
        )}
      </main>
    </div>
  );
};

export default UploadPhotos;
