"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import Cropper from "react-easy-crop";
import { getCroppedImg } from "@/lib/utils/canvasUtils";
import { supabase } from "@/lib/supabase/supabaseClient";
import {
  Loader2,
  Plus,
  Trash2,
  Edit2,
  UploadCloud,
  User,
  Save,
  X,
  ZoomIn,
  Check,
  ToggleLeft,
  ToggleRight,
  EyeOff,
  Eye,
  Users,
  Image as ImageIcon,
} from "lucide-react";
import { buildStaffPath, PUBLIC_MEDIA_BUCKET } from "@/lib/storage/paths";

type Profesor = {
  id_profesor?: number;
  id_club?: number;
  nombre: string;
  descripcion?: string;
  foto_url: string;
  telefono: string;
  instagram: string;
  activo?: boolean;
  created_at?: string;
};

interface Props {
  initialData: Profesor[];
  clubId: number;
  subdominio: string;
  initialActivo: boolean;
  initialTeamPhoto: string | null;
}

export default function ProfesoresClient({
  initialData,
  clubId,
  subdominio,
  initialActivo,
  initialTeamPhoto,
}: Props) {
  const MAX_PROFESORES = 10;
  // --- ESTADOS ---
  const [profesores, setProfesores] = useState<Profesor[]>(initialData || []);
  const [editingId, setEditingId] = useState<number | "new" | null>(null);
  const [saving, setSaving] = useState(false);

  // Toggle Sección
  const [seccionActiva, setSeccionActiva] = useState(initialActivo);
  const [updatingToggle, setUpdatingToggle] = useState(false);

  // Foto Grupal
  const [teamPhoto, setTeamPhoto] = useState<string | null>(initialTeamPhoto);
  const [uploadingTeamPhoto, setUploadingTeamPhoto] = useState(false);

  // Cropper
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [tempImgSrc, setTempImgSrc] = useState<string | null>(null);
  const [cropType, setCropType] = useState<"individual" | "team">("individual");

  const [formData, setFormData] = useState<Profesor>({
    nombre: "",
    telefono: "",
    instagram: "",
    foto_url: "",
    descripcion: "",
    activo: true,
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // --- MANEJO DE ACTIVAR/DESACTIVAR PROFESOR ---
  const handleToggleProfesorActivo = async (profesor: Profesor) => {
    const nuevoEstado = !profesor.activo;

    // Actualización optimista en la UI
    setProfesores((prev) =>
      prev.map((p) =>
        p.id_profesor === profesor.id_profesor
          ? { ...p, activo: nuevoEstado }
          : p
      )
    );

    // Actualización en la base de datos
    const { error } = await supabase
      .from("profesores")
      .update({ activo: nuevoEstado })
      .eq("id_profesor", profesor.id_profesor);

    if (error) {
      // Si falla, revertir el cambio en la UI y notificar
      alert("Error al actualizar el estado del profesor.");
      console.error(error);
      setProfesores((prev) =>
        prev.map((p) =>
          p.id_profesor === profesor.id_profesor
            ? { ...p, activo: profesor.activo } // Revertir al estado original
            : p
        )
      );
    }
  };

  // --- EFECTO: Sincronizar estado real ---
  useEffect(() => {
    const verificarEstadoReal = async () => {
      const { data, error } = await supabase
        .from("clubes")
        .select("activo_profesores")
        .eq("id_club", clubId)
        .single();

      if (data && !error) {
        if (data.activo_profesores !== seccionActiva) {
          setSeccionActiva(data.activo_profesores);
        }
      }
    };
    verificarEstadoReal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clubId]);

  // --- ACCIÓN: TOGGLE SECCIÓN ---
  const handleToggleSeccion = async () => {
    const nuevoEstado = !seccionActiva;
    if (nuevoEstado === true && profesores.length === 0) {
      if (
        !window.confirm(
          "⚠️ Advertencia: No hay profesores cargados. La sección aparecerá vacía. ¿Continuar?"
        )
      )
        return;
    }

    setUpdatingToggle(true);
    try {
      const { error } = await supabase
        .from("clubes")
        .update({ activo_profesores: nuevoEstado })
        .eq("id_club", clubId);
      if (error) throw error;
      setSeccionActiva(nuevoEstado);
    } catch (error) {
      console.error(error);
      alert("No se pudo actualizar el estado.");
    } finally {
      setUpdatingToggle(false);
    }
  };

  // --- ACCIÓN: SELECCIONAR FOTO GRUPAL ---
  const handleTeamPhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = () => {
        setTempImgSrc(reader.result as string);
        setCropType("team");
        setIsCropping(true);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
      };
      reader.readAsDataURL(file);
      e.target.value = "";
    }
  };

  // --- ACCIÓN: ELIMINAR FOTO GRUPAL (Vía API) ---
  const handleDeleteTeamPhoto = async () => {
    if (!confirm("¿Eliminar foto grupal de la web?")) return;
    setUploadingTeamPhoto(true);

    try {
      const formDataAPI = new FormData();
      formDataAPI.append("clubId", clubId.toString());
      formDataAPI.append("action", "delete");

      const response = await fetch("/api/admin/profesores/team-photo", {
        method: "POST",
        body: formDataAPI,
      });

      const responseText = await response.text();

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${responseText}`);
      }

      setTeamPhoto(null);
    } catch (err: any) {
      console.error(err);
      alert(err.message || "Error eliminando foto");
    } finally {
      setUploadingTeamPhoto(false);
    }
  };

  // --- CRUD PROFESORES ---
  const handleEdit = (prof: Profesor) => {
    setFormData({ ...prof });
    setEditingId(prof.id_profesor!);
    setSelectedFile(null);
  };

  const handleNew = () => {
    if (profesores.length >= MAX_PROFESORES) {
      alert(`Has alcanzado el límite de ${MAX_PROFESORES} profesores.`);
      return;
    }
    setFormData({
      nombre: "",
      telefono: "",
      instagram: "",
      foto_url: "",
      descripcion: "",
      activo: true,
    });
    setEditingId("new");
    setSelectedFile(null);
  };

  const handleDelete = async (id: number) => {
    if (!confirm("¿Eliminar profesor?")) return;
    const { error } = await supabase
      .from("profesores")
      .delete()
      .eq("id_profesor", id);
    if (!error) {
      setProfesores((prev) => prev.filter((p) => p.id_profesor !== id));
      if (editingId === id) setEditingId(null);
    } else {
      alert("Error al eliminar");
    }
  };

  const handleSave = async () => {
    if (!formData.nombre) return alert("Nombre obligatorio");
    setSaving(true);
    try {
      let finalUrl = formData.foto_url;
      if (selectedFile) {
        const path = buildStaffPath(clubId, selectedFile);
        const { error: upErr } = await supabase.storage
          .from(PUBLIC_MEDIA_BUCKET)
          .upload(path, selectedFile, { upsert: true });
        if (upErr) throw upErr;
        const { data } = supabase.storage
          .from(PUBLIC_MEDIA_BUCKET)
          .getPublicUrl(path);
        finalUrl = data.publicUrl;
      }

      const payload = {
        id_club: clubId,
        nombre: formData.nombre,
        descripcion: formData.descripcion,
        foto_url: finalUrl,
        telefono: formData.telefono,
        instagram: formData.instagram,
        activo: formData.activo ?? true,
      };

      if (editingId !== "new") {
        const { data, error } = await supabase
          .from("profesores")
          .update(payload)
          .eq("id_profesor", editingId)
          .select()
          .single();
        if (error) throw error;
        setProfesores((prev) =>
          prev.map((p) => (p.id_profesor === editingId ? data : p))
        );
      } else {
        const { data, error } = await supabase
          .from("profesores")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        setProfesores((prev) => [...prev, data]);
      }
      setEditingId(null);
      setSelectedFile(null);
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // --- CROPPER UTILS ---
  const handleIndividualFileChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    if (e.target.files?.[0]) {
      const reader = new FileReader();
      reader.onload = () => {
        setTempImgSrc(reader.result as string);
        setCropType("individual");
        setIsCropping(true);
        setZoom(1);
        setCrop({ x: 0, y: 0 });
      };
      reader.readAsDataURL(e.target.files[0]);
      e.target.value = "";
    }
  };

  const handleCropSave = async () => {
    try {
      if (!tempImgSrc || !croppedAreaPixels) return;
      const croppedBlob = await getCroppedImg(tempImgSrc, croppedAreaPixels);

      if (cropType === "individual") {
        setSelectedFile(croppedBlob);
        setFormData((prev) => ({
          ...prev,
          foto_url: URL.createObjectURL(croppedBlob),
        }));
        setIsCropping(false);
      } else if (cropType === "team") {
        setUploadingTeamPhoto(true);
        // No cerramos modal para evitar parpadeos si falla

        const formDataAPI = new FormData();
        formDataAPI.append("clubId", clubId.toString());
        formDataAPI.append("action", "upload"); // La API espera 'upload'
        formDataAPI.append("file", croppedBlob, "team-photo.jpg");

        const response = await fetch("/api/admin/profesores/team-photo", {
          method: "POST",
          body: formDataAPI,
        });

        const responseText = await response.text();

        if (!response.ok) {
          console.error("Error servidor:", responseText);
          throw new Error(
            `Error ${response.status}: ${responseText.slice(0, 50)}...`
          );
        }

        try {
          const result = JSON.parse(responseText);
          if (result.error) throw new Error(result.error);
          setTeamPhoto(result.url);
          alert("Foto guardada correctamente");
          setIsCropping(false);
        } catch (e) {
          throw new Error("El servidor no devolvió un JSON válido.");
        }
      }
    } catch (e: any) {
      console.error(e);
      alert("Error: " + e.message);
    } finally {
      setUploadingTeamPhoto(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10 -m-6 md:-m-10 relative">
      {/* CROPPER MODAL */}
      {isCropping && tempImgSrc && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4 animate-in fade-in duration-200">
          <div
            className={`relative w-full max-w-4xl bg-gray-800 rounded-xl overflow-hidden shadow-2xl ${
              cropType === "team" ? "h-[70vh]" : "h-[60vh] max-w-2xl"
            }`}
          >
            <Cropper
              image={tempImgSrc}
              crop={crop}
              zoom={zoom}
              aspect={cropType === "team" ? 16 / 9 : 3 / 4}
              onCropChange={setCrop}
              onCropComplete={(area, pixels) => setCroppedAreaPixels(pixels)}
              onZoomChange={setZoom}
            />
          </div>

          <div className="mt-6 flex flex-col items-center w-full max-w-md gap-4">
            <div className="flex items-center gap-4 bg-gray-800 p-3 rounded-xl border border-gray-700 w-full">
              <ZoomIn className="text-gray-400 w-5 h-5" />
              <input
                type="range"
                value={zoom}
                min={1}
                max={3}
                step={0.1}
                onChange={(e) => setZoom(Number(e.target.value))}
                className="w-full h-2 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
                aria-label="Zoom imagen"
                title="Zoom imagen"
              />
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setIsCropping(false)}
                className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                type="button"
                title="Cancelar recorte"
              >
                Cancelar
              </button>
              <button
                onClick={handleCropSave}
                className="px-8 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-500 transition-colors font-bold shadow-lg"
                type="button"
                title="Guardar recorte"
              >
                {cropType === "team" ? "Recortar y Guardar" : "Recortar"}
              </button>
            </div>
            {cropType === "team" && (
              <p className="text-gray-400 text-sm">Formato panorámico (16:9)</p>
            )}
          </div>
        </div>
      )}

      <div className="max-w-[1600px] mx-auto space-y-8 pb-32">
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              Equipo de Profesores
            </h1>
            <p className="text-slate-500 mt-2">
              Gestiona los perfiles de:{" "}
              <span className="font-semibold text-slate-700">
                {subdominio}.versori.com/profesores
              </span>
            </p>
            <p className="text-sm text-slate-500 mt-1">
              Puedes añadir un máximo de {MAX_PROFESORES} profesores.
            </p>
          </div>
          <div className="flex gap-4 items-center">
            {/* Toggle */}
            <div
              className={`flex items-center gap-3 px-4 py-2 rounded-xl border-2 transition-colors ${
                seccionActiva
                  ? "bg-green-50 border-green-200"
                  : "bg-slate-100 border-slate-200"
              }`}
            >
              <div className="flex flex-col text-xs font-bold uppercase">
                <span
                  className={
                    seccionActiva ? "text-green-700" : "text-slate-500"
                  }
                >
                  Estado
                </span>
                <span
                  className={
                    seccionActiva ? "text-green-800" : "text-slate-600"
                  }
                >
                  {seccionActiva ? "Visible" : "Oculto"}
                </span>
              </div>
              <button
                onClick={handleToggleSeccion}
                disabled={updatingToggle}
                title={seccionActiva ? "Ocultar sección" : "Mostrar sección"}
                aria-label="Cambiar visibilidad de la sección"
                type="button"
              >
                {updatingToggle ? (
                  <Loader2 className="animate-spin" />
                ) : seccionActiva ? (
                  <ToggleRight className="w-8 h-8 text-green-600" />
                ) : (
                  <ToggleLeft className="w-8 h-8 text-slate-400" />
                )}
              </button>
            </div>
            {!editingId && (
              <button
                onClick={handleNew}
                disabled={profesores.length >= MAX_PROFESORES}
                className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 disabled:bg-slate-400 disabled:cursor-not-allowed"
                title={
                  profesores.length >= MAX_PROFESORES
                    ? `Límite de ${MAX_PROFESORES} profesores alcanzado`
                    : "Agregar nuevo profesor"
                }
                type="button"
              >
                <Plus className="w-5 h-5" /> Nuevo
              </button>
            )}
          </div>
        </div>

        {/* --- SECCIÓN FOTO GRUPAL --- */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex flex-col md:flex-row gap-6 items-center">
            <div className="relative w-full md:w-64 h-40 bg-slate-100 rounded-lg overflow-hidden border-2 border-dashed border-slate-300 flex items-center justify-center flex-shrink-0">
              {teamPhoto ? (
                <Image
                  src={teamPhoto}
                  alt="Equipo"
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="text-center p-4">
                  <Users className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <span className="text-xs text-slate-400">
                    Sin foto grupal
                  </span>
                </div>
              )}
              {uploadingTeamPhoto && (
                <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                  <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-3">
              <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-blue-600" /> Foto Grupal
              </h3>
              <p className="text-slate-500 text-sm">
                Opcional. Aparecerá debajo de los profesores en la web. Se
                recomienda usar una foto panorámica.
              </p>
              <div className="flex gap-3">
                <label className="cursor-pointer bg-slate-900 text-white px-4 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-slate-800 transition-colors">
                  {teamPhoto ? "Cambiar Foto" : "Subir Foto"}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleTeamPhotoSelect}
                    disabled={uploadingTeamPhoto}
                    title="Seleccionar foto grupal"
                  />
                </label>
                {teamPhoto && (
                  <button
                    onClick={handleDeleteTeamPhoto}
                    disabled={uploadingTeamPhoto}
                    className="text-red-600 px-4 py-2 rounded-lg text-sm flex items-center gap-2 border border-red-200 hover:bg-red-50"
                    title="Eliminar foto grupal"
                    type="button"
                  >
                    <Trash2 className="w-4 h-4" /> Eliminar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
          {/* EDITOR / LISTA */}
          <div className="space-y-6">
            {editingId ? (
              <section className="bg-white p-8 rounded-2xl border border-slate-200 shadow-lg">
                <div className="flex justify-between items-center mb-6 border-b pb-4">
                  <h2 className="text-xl font-bold">
                    {editingId === "new" ? "Nuevo Profesor" : "Editar Profesor"}
                  </h2>
                  <button
                    onClick={() => setEditingId(null)}
                    title="Cerrar formulario"
                    type="button"
                  >
                    <X className="w-6 h-6 text-slate-400" />
                  </button>
                </div>
                {/* Formulario */}
                <div className="space-y-6">
                  <div className="flex items-center gap-6">
                    <div className="relative w-24 h-32 bg-slate-100 rounded border overflow-hidden">
                      {formData.foto_url ? (
                        <Image
                          src={formData.foto_url}
                          alt="Avatar"
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <User className="w-10 h-10 m-auto text-slate-300 mt-10" />
                      )}
                    </div>
                    <div>
                      <label className="cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded font-bold text-sm flex gap-2 hover:bg-blue-100">
                        <UploadCloud className="w-4 h-4" /> Subir Foto
                        <input
                          type="file"
                          className="hidden"
                          onChange={handleIndividualFileChange}
                          title="Seleccionar foto de perfil"
                        />
                      </label>
                      <p className="text-xs text-slate-400 mt-2">
                        Formato 3:4 (Retrato)
                      </p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label className="block text-sm font-bold mb-1">
                        Nombre
                      </label>
                      <input
                        className="w-full border p-2 rounded"
                        value={formData.nombre}
                        onChange={(e) =>
                          setFormData({ ...formData, nombre: e.target.value })
                        }
                        placeholder="Nombre completo"
                        title="Nombre del profesor"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">
                        Teléfono
                      </label>
                      <input
                        className="w-full border p-2 rounded"
                        value={formData.telefono}
                        onChange={(e) =>
                          setFormData({ ...formData, telefono: e.target.value })
                        }
                        placeholder="+54 ..."
                        title="Número de teléfono"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold mb-1">
                        Instagram
                      </label>
                      <input
                        className="w-full border p-2 rounded"
                        value={formData.instagram}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            instagram: e.target.value,
                          })
                        }
                        placeholder="usuario sin @"
                        title="Usuario de Instagram"
                      />
                    </div>
                    <div className="col-span-2">
                      <label className="block text-sm font-bold mb-1">
                        Descripción
                      </label>
                      <textarea
                        className="w-full border p-2 rounded"
                        rows={3}
                        value={formData.descripcion || ""}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            descripcion: e.target.value,
                          })
                        }
                        placeholder="Biografía breve"
                        title="Descripción del profesor"
                      />
                    </div>
                  </div>
                  <div className="space-y-6 pt-6 border-t mt-6">
                    {/* --- Toggle Activo --- */}
                    <div className="flex items-center justify-between">
                      <div>
                        <label
                          htmlFor="activo-toggle"
                          className="font-bold text-slate-700"
                        >
                          Visible en la web
                        </label>
                        <p className="text-xs text-slate-500">
                          Si está oculto, no aparecerá en la página pública.
                        </p>
                      </div>
                      <button
                        id="activo-toggle"
                        onClick={() =>
                          setFormData((prev) => ({
                            ...prev,
                            activo: !prev.activo,
                          }))
                        }
                        type="button"
                        title={
                          formData.activo
                            ? "Marcar como oculto"
                            : "Marcar como visible"
                        }
                      >
                        {formData.activo ? (
                          <ToggleRight className="w-10 h-10 text-green-600" />
                        ) : (
                          <ToggleLeft className="w-10 h-10 text-slate-400" />
                        )}
                      </button>
                    </div>

                    {/* --- Botones de acción --- */}
                    <div className="flex justify-end gap-3">
                      <button
                        onClick={() => setEditingId(null)}
                        className="px-4 py-2 text-slate-600 rounded-lg"
                        type="button"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 disabled:bg-blue-300 flex items-center gap-2"
                        type="button"
                      >
                        {saving ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Save className="w-4 h-4" />
                        )}
                        {saving ? "Guardando..." : "Guardar"}
                      </button>
                    </div>
                  </div>
                </div>
              </section>
            ) : (
              <div className="grid gap-4">
                {profesores.length === 0 && (
                  <div className="text-center py-10 border-2 border-dashed rounded-xl">
                    <p className="text-slate-500">
                      No hay profesores cargados.
                    </p>
                  </div>
                )}
                {profesores.map((p) => (
                  <div
                    key={p.id_profesor}
                    className={`bg-white p-4 rounded-xl border flex items-center gap-4 transition-all ${
                      !p.activo ? "bg-slate-50/50" : ""
                    }`}
                  >
                    <div className="relative w-14 h-18 bg-slate-100 rounded overflow-hidden flex-shrink-0 h-20 w-16">
                      {p.foto_url ? (
                        <Image
                          src={p.foto_url}
                          alt={p.nombre}
                          fill
                          className={`object-cover ${
                            !p.activo ? "grayscale" : ""
                          }`}
                        />
                      ) : (
                        <User className="w-6 h-6 m-auto text-slate-300 mt-6" />
                      )}
                      {!p.activo && (
                        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                          <EyeOff className="w-5 h-5 text-white" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1">
                      <h3
                        className={`font-bold ${
                          !p.activo ? "text-slate-400" : ""
                        }`}
                      >
                        {p.nombre}
                      </h3>
                      <p className="text-sm text-slate-500 line-clamp-1">
                        {p.descripcion || "Profesor"}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 md:gap-2">
                      <button
                        onClick={() => handleToggleProfesorActivo(p)}
                        className={`p-2 rounded-full transition-colors ${
                          p.activo
                            ? "text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                            : "text-green-600 hover:bg-green-50"
                        }`}
                        title={
                          p.activo
                            ? "Ocultar de la web"
                            : "Hacer visible en la web"
                        }
                        type="button"
                      >
                        {p.activo ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEdit(p)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full"
                        title="Editar profesor"
                        type="button"
                      >
                        <Edit2 className="w-5 h-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(p.id_profesor!)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-full"
                        title="Eliminar profesor"
                        type="button"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* PREVIEW */}
          <div className="hidden xl:block xl:sticky xl:top-6">
            <div
              className={`bg-[#0b0d12] rounded-[2rem] border-[8px] border-slate-800 shadow-2xl h-[800px] overflow-hidden flex flex-col relative ${
                !seccionActiva ? "grayscale opacity-50" : ""
              }`}
            >
              {!seccionActiva && (
                <div className="absolute inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur">
                  <div className="bg-white/10 p-4 rounded-xl border border-white/20 text-center text-white">
                    <EyeOff className="mx-auto mb-2" />
                    <p className="font-bold">Sección Oculta</p>
                  </div>
                </div>
              )}
              <div className="bg-slate-800 p-3 flex justify-center">
                <div className="bg-slate-700 px-4 py-1 rounded-full text-xs text-slate-300">
                  versori.com/profesores
                </div>
              </div>
              <div className="flex-1 overflow-y-auto bg-gradient-to-b from-[#0b0d12] to-[#0e1a2b] p-6 custom-scrollbar">
                <div className="text-center mb-8">
                  <h2 className="text-2xl font-bold text-white">
                    Nuestro Equipo
                  </h2>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {(editingId
                    ? [
                        ...profesores.filter(
                          (p) => p.id_profesor !== editingId
                        ),
                        formData,
                      ]
                    : profesores
                  ).map((p, idx) => (
                    <div
                      key={idx}
                      className="bg-[#12141a] rounded-lg overflow-hidden border border-white/5 pb-2"
                    >
                      <div className="relative aspect-[3/4] bg-[#0e1a2b]">
                        {p.foto_url && (
                          <Image
                            src={p.foto_url}
                            alt=""
                            fill
                            className="object-cover"
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                        <div className="absolute bottom-2 left-0 right-0 text-center">
                          <p className="text-white font-bold text-sm">
                            {p.nombre || "Nombre"}
                          </p>
                          <p className="text-blue-400 text-[10px] uppercase font-bold">
                            Profesor
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                {teamPhoto && (
                  <div className="mt-8 pt-6 border-t border-white/10 text-center">
                    <h3 className="text-white text-sm font-bold mb-3">
                      Galería Grupal
                    </h3>
                    <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10">
                      <Image
                        src={teamPhoto}
                        alt="Equipo"
                        fill
                        className="object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
