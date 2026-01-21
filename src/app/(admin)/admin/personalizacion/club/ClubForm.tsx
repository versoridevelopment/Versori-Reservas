"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Loader2,
  Save,
  UploadCloud,
  Monitor,
  MapPin,
  Mail,
  Instagram,
  Palette,
  Type,
  Trash2,
  Plus,
  ImageIcon,
  AlignLeft,
  X,
  FileText,
  Camera,
  Phone,
  MessageCircle, // Icono para la leyenda de WhatsApp
} from "lucide-react";

// --- TIPOS ---
type ClubData = {
  nombre: string;
  subdominio: string;
  logo_url: string | null;
  imagen_hero_url: string | null;
  color_primario: string;
  color_secundario: string;
  color_texto: string;
  texto_bienvenida_titulo: string;
  texto_bienvenida_subtitulo: string;
  marcas: { id: string; tipo: "imagen" | "texto"; valor: string }[];
  email: string;
  usuario_instagram: string;
  telefono: string;
  calle: string;
  altura: string;
  barrio: string;
  activo_contacto_home: boolean;
};

type Valor = { titulo: string; contenido: string };

type NosotrosData = {
  activo_nosotros: boolean;
  historia_titulo: string;
  hero_descripcion: string;
  historia_contenido: string;
  frase_cierre: string;
  historia_imagen_url: string | null;
  galeria_inicio: string[];
  valores: Valor[];
  home_titulo?: string;
  home_descripcion?: string;
};

interface Props {
  initialData: ClubData;
  nosotrosInitialData: NosotrosData | null;
  clubId: number;
}

export default function ClubForm({
  initialData,
  nosotrosInitialData,
  clubId,
}: Props) {
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<
    "identidad" | "estilo" | "contacto" | "marcas" | "nosotros" | "galeria"
  >("identidad");

  const [formData, setFormData] = useState<ClubData>({
    ...initialData,
    // FORZAMOS TRUE: Ya no es opcional, siempre estará activo si hay número
    activo_contacto_home: true,
  });

  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [heroFile, setHeroFile] = useState<File | null>(null);
  const [brandFiles, setBrandFiles] = useState<Record<string, File>>({});

  const [nosotrosData, setNosotrosData] = useState<NosotrosData>(
    nosotrosInitialData || {
      activo_nosotros: true,
      historia_titulo: "",
      hero_descripcion: "",
      historia_contenido: "",
      frase_cierre: "",
      historia_imagen_url: null,
      galeria_inicio: [],
      valores: [],
      home_titulo: "",
      home_descripcion: "",
    },
  );

  const [newGalleryFiles, setNewGalleryFiles] = useState<File[]>([]);
  const [newGalleryPreviews, setNewGalleryPreviews] = useState<string[]>([]);

  const isVideo = (url: string) => url?.match(/\.(mp4|webm|mov)$/i);

  useEffect(() => {
    if (formData.logo_url) {
      let link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      const isRemote = formData.logo_url.startsWith("http");
      link.href = isRemote
        ? `${formData.logo_url}?t=${Date.now()}`
        : formData.logo_url;
    }
  }, [formData.logo_url]);

  const handleChange = (field: keyof ClubData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleFileSelect = (
    e: React.ChangeEvent<HTMLInputElement>,
    type: "logo" | "hero",
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      if (type === "logo") {
        setLogoFile(file);
        setFormData((prev) => ({
          ...prev,
          logo_url: URL.createObjectURL(file),
        }));
      } else {
        setHeroFile(file);
        setFormData((prev) => ({
          ...prev,
          imagen_hero_url: URL.createObjectURL(file),
        }));
      }
    }
  };

  const handleRemoveLogo = () => {
    setLogoFile(null);
    setFormData((prev) => ({ ...prev, logo_url: null }));
  };

  const addMarca = () =>
    setFormData((prev) => ({
      ...prev,
      marcas: [
        ...prev.marcas,
        { id: crypto.randomUUID(), tipo: "texto", valor: "Nueva Marca" },
      ],
    }));

  const removeMarca = (id: string) => {
    setFormData((prev) => ({
      ...prev,
      marcas: prev.marcas.filter((m) => m.id !== id),
    }));
    const newFiles = { ...brandFiles };
    delete newFiles[id];
    setBrandFiles(newFiles);
  };

  const updateMarcaValor = (id: string, valor: string) =>
    setFormData((prev) => ({
      ...prev,
      marcas: prev.marcas.map((m) => (m.id === id ? { ...m, valor } : m)),
    }));

  const toggleMarcaTipo = (id: string) =>
    setFormData((prev) => ({
      ...prev,
      marcas: prev.marcas.map((m) =>
        m.id === id
          ? {
              ...m,
              tipo: m.tipo === "texto" ? "imagen" : "texto",
              valor: m.tipo === "texto" ? "" : "Nueva Marca",
            }
          : m,
      ),
    }));

  const handleBrandFileChange = (
    id: string,
    e: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setBrandFiles((prev) => ({ ...prev, [id]: file }));
      updateMarcaValor(id, URL.createObjectURL(file));
    }
  };

  const handleNosotrosChange = (field: keyof NosotrosData, value: any) => {
    setNosotrosData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGallerySelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files);
      setNewGalleryFiles((prev) => [...prev, ...files]);
      const newPreviews = files.map((f) => URL.createObjectURL(f));
      setNewGalleryPreviews((prev) => [...prev, ...newPreviews]);
      e.target.value = "";
    }
  };

  const removeGalleryImage = (index: number, isNew: boolean) => {
    if (isNew) {
      setNewGalleryFiles((prev) => prev.filter((_, i) => i !== index));
      setNewGalleryPreviews((prev) => {
        URL.revokeObjectURL(prev[index]);
        return prev.filter((_, i) => i !== index);
      });
    } else {
      setNosotrosData((prev) => ({
        ...prev,
        galeria_inicio: prev.galeria_inicio.filter((_, i) => i !== index),
      }));
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const formDataToSend = new FormData();
      formDataToSend.append("clubId", clubId.toString());

      // Forzamos activo_contacto_home a true al guardar
      const finalClubData = { ...formData, activo_contacto_home: true };
      formDataToSend.append("clubData", JSON.stringify(finalClubData));

      formDataToSend.append("nosotrosData", JSON.stringify(nosotrosData));

      if (logoFile) formDataToSend.append("logoFile", logoFile);
      if (heroFile) formDataToSend.append("heroFile", heroFile);

      Object.keys(brandFiles).forEach((brandId) => {
        formDataToSend.append(`brand_file_${brandId}`, brandFiles[brandId]);
      });

      if (newGalleryFiles.length > 0) {
        newGalleryFiles.forEach((file) =>
          formDataToSend.append("galleryFiles", file),
        );
      }

      const response = await fetch("/api/admin/club/update", {
        method: "POST",
        body: formDataToSend,
      });

      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Error al guardar");

      setBrandFiles({});
      setLogoFile(null);
      setHeroFile(null);
      setNewGalleryFiles([]);
      setNewGalleryPreviews([]);

      alert("¡Cambios guardados correctamente!");
      window.location.reload();
    } catch (error: any) {
      console.error(error);
      alert(`Error: ${error.message}`);
    } finally {
      setSaving(false);
    }
  };

  const getPreviewTitle = () => {
    if (activeTab === "nosotros") return "Sección Nosotros (Home)";
    if (activeTab === "galeria") return "Galería de Imágenes";
    return "Página de Inicio (Home)";
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 md:p-10 -m-6 md:-m-10">
      <div className="md:hidden fixed bottom-6 right-6 z-[9999]">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="bg-green-600 text-white w-14 h-14 rounded-full shadow-2xl flex items-center justify-center border-2 border-white/20 active:scale-95 transition-all hover:bg-green-700"
          title="Guardar cambios"
          aria-label="Guardar cambios"
        >
          {saving ? (
            <Loader2 className="animate-spin w-6 h-6" />
          ) : (
            <Save className="w-6 h-6" />
          )}
        </button>
      </div>

      <div className="max-w-7xl mx-auto space-y-8 pb-32">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              Personalización
            </h1>
            <p className="text-slate-500 mt-2 text-lg">
              Gestiona la identidad y el contenido.
            </p>
          </div>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className="hidden md:flex bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl font-bold gap-2 items-center shadow-lg hover:-translate-y-1 disabled:opacity-70"
            title="Guardar todos los cambios"
            aria-label="Guardar todos los cambios"
          >
            {saving ? (
              <Loader2 className="animate-spin w-5 h-5" />
            ) : (
              <Save className="w-5 h-5" />
            )}
            Guardar Todo
          </button>
        </div>

        {/* Tabs */}
        <div className="flex space-x-1 bg-white p-1 rounded-xl border border-slate-200 shadow-sm overflow-x-auto">
          {[
            { id: "identidad", label: "Identidad", icon: Monitor },
            { id: "estilo", label: "Estilo", icon: Palette },
            { id: "contacto", label: "Contacto", icon: MapPin },
            { id: "marcas", label: "Marcas", icon: Type },
            { id: "nosotros", label: "Nosotros", icon: FileText },
            { id: "galeria", label: "Galería", icon: Camera },
          ].map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold text-sm transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-slate-900 text-white shadow-md"
                  : "text-slate-500 hover:bg-slate-100"
              }`}
              title={`Ir a sección ${tab.label}`}
              aria-label={`Ir a sección ${tab.label}`}
            >
              <tab.icon className="w-4 h-4" /> {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            {/* TAB IDENTIDAD */}
            {activeTab === "identidad" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-800 mb-4">
                    Datos Principales
                  </h2>
                  <div className="mb-4">
                    <label
                      htmlFor="nombre_club"
                      className="block text-sm font-semibold text-slate-700 mb-1"
                    >
                      Nombre
                    </label>
                    <input
                      id="nombre_club"
                      type="text"
                      value={formData.nombre}
                      onChange={(e) => handleChange("nombre", e.target.value)}
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                      placeholder="Nombre del Club"
                      title="Nombre del club"
                      aria-label="Nombre del club"
                    />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800 mb-4 mt-6">
                    Logo
                  </h2>
                  <div className="flex items-center gap-6 mt-4">
                    <div className="relative w-20 h-20 bg-slate-100 rounded-xl border border-slate-200 flex items-center justify-center overflow-hidden">
                      {formData.logo_url ? (
                        <Image
                          src={formData.logo_url}
                          alt="Logo"
                          fill
                          className="object-contain p-2"
                        />
                      ) : (
                        <span className="text-xs">Sin Logo</span>
                      )}
                    </div>
                    <label
                      className="cursor-pointer bg-blue-50 text-blue-600 px-4 py-2 rounded-lg font-bold hover:bg-blue-100 text-sm"
                      title="Subir logo"
                    >
                      Subir Logo{" "}
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e, "logo")}
                        title="Seleccionar archivo logo"
                      />
                    </label>
                    {formData.logo_url && (
                      <button
                        type="button"
                        onClick={handleRemoveLogo}
                        className="text-red-500 hover:text-red-700 p-2"
                        title="Eliminar logo"
                        aria-label="Eliminar logo"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    )}
                  </div>
                </section>
                <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-800 mb-4">
                    Portada (Hero)
                  </h2>
                  <div className="relative w-full aspect-video bg-slate-100 rounded-xl overflow-hidden flex items-center justify-center border border-slate-200">
                    {formData.imagen_hero_url ? (
                      isVideo(formData.imagen_hero_url) ? (
                        <video
                          src={formData.imagen_hero_url}
                          className="w-full h-full object-cover"
                          autoPlay
                          muted
                          loop
                        />
                      ) : (
                        <Image
                          src={formData.imagen_hero_url}
                          alt="Hero"
                          fill
                          className="object-cover"
                        />
                      )
                    ) : (
                      <div className="flex flex-col items-center text-slate-400">
                        <ImageIcon className="w-10 h-10 mb-2" />
                        <span>Sin Portada</span>
                      </div>
                    )}
                    <label
                      className="absolute bottom-4 right-4 cursor-pointer bg-white text-slate-800 px-4 py-2 rounded-lg font-bold shadow-md hover:bg-slate-50 text-sm flex items-center gap-2"
                      title="Cambiar portada"
                    >
                      <UploadCloud className="w-4 h-4" /> Cambiar{" "}
                      <input
                        type="file"
                        accept="image/*,video/mp4,video/webm"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e, "hero")}
                        title="Seleccionar archivo portada"
                      />
                    </label>
                  </div>
                </section>
              </div>
            )}

            {/* TAB CONTACTO */}
            {activeTab === "contacto" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-800 mb-4">
                    Datos de Contacto
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="email"
                        className="block text-sm font-semibold text-slate-700 mb-1"
                      >
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          id="email"
                          type="email"
                          value={formData.email}
                          onChange={(e) =>
                            handleChange("email", e.target.value)
                          }
                          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl"
                          placeholder="contacto@email.com"
                          title="Email"
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="instagram"
                        className="block text-sm font-semibold text-slate-700 mb-1"
                      >
                        Instagram
                      </label>
                      <div className="relative">
                        <Instagram className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          id="instagram"
                          type="text"
                          value={formData.usuario_instagram}
                          onChange={(e) =>
                            handleChange("usuario_instagram", e.target.value)
                          }
                          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl"
                          placeholder="@usuario"
                          title="Instagram"
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="telefono"
                        className="block text-sm font-semibold text-slate-700 mb-1"
                      >
                        WhatsApp / Teléfono
                      </label>
                      <div className="relative">
                        <Phone className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                        <input
                          id="telefono"
                          type="text"
                          value={formData.telefono}
                          onChange={(e) =>
                            handleChange("telefono", e.target.value)
                          }
                          className="w-full pl-10 pr-4 py-2 border border-slate-300 rounded-xl"
                          placeholder="+54 9..."
                          title="WhatsApp"
                        />
                      </div>

                      {/* LEYENDA INFORMATIVA (Reemplaza el toggle) */}
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-100 rounded-xl flex gap-3 items-start">
                        <MessageCircle className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
                        <p className="text-xs text-blue-800 leading-relaxed">
                          <strong>Acceso Directo:</strong> Este número se
                          utilizará automáticamente para el botón flotante de
                          WhatsApp en la portada del sitio.
                        </p>
                      </div>
                    </div>
                  </div>
                </section>
                <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-800 mb-4">
                    Ubicación
                  </h2>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="col-span-2">
                      <label
                        htmlFor="calle"
                        className="block text-sm font-semibold text-slate-700 mb-1"
                      >
                        Calle
                      </label>
                      <input
                        id="calle"
                        type="text"
                        value={formData.calle}
                        onChange={(e) => handleChange("calle", e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                        placeholder="Calle Principal"
                        title="Calle"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="altura"
                        className="block text-sm font-semibold text-slate-700 mb-1"
                      >
                        Altura
                      </label>
                      <input
                        id="altura"
                        type="text"
                        value={formData.altura}
                        onChange={(e) => handleChange("altura", e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                        placeholder="123"
                        title="Altura"
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="barrio"
                        className="block text-sm font-semibold text-slate-700 mb-1"
                      >
                        Barrio
                      </label>
                      <input
                        id="barrio"
                        type="text"
                        value={formData.barrio}
                        onChange={(e) => handleChange("barrio", e.target.value)}
                        className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                        placeholder="Centro"
                        title="Barrio"
                      />
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* TAB MARCAS */}
            {activeTab === "marcas" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-lg font-bold text-slate-800">Marcas</h2>
                    <button
                      type="button"
                      onClick={addMarca}
                      className="text-sm bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg font-bold hover:bg-blue-100 flex items-center gap-1"
                      title="Agregar marca"
                    >
                      <Plus className="w-4 h-4" /> Agregar
                    </button>
                  </div>
                  <div className="space-y-4">
                    {formData.marcas.map((marca) => (
                      <div
                        key={marca.id}
                        className="flex flex-col gap-2 p-4 border border-slate-100 rounded-xl bg-slate-50"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => toggleMarcaTipo(marca.id)}
                              className={`p-1.5 rounded-lg ${
                                marca.tipo === "texto"
                                  ? "bg-blue-100 text-blue-600"
                                  : "text-slate-400"
                              }`}
                              title="Tipo texto"
                            >
                              <AlignLeft className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => toggleMarcaTipo(marca.id)}
                              className={`p-1.5 rounded-lg ${
                                marca.tipo === "imagen"
                                  ? "bg-blue-100 text-blue-600"
                                  : "text-slate-400"
                              }`}
                              title="Tipo imagen"
                            >
                              <ImageIcon className="w-4 h-4" />
                            </button>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeMarca(marca.id)}
                            className="text-red-400 hover:text-red-600 p-1"
                            title="Eliminar marca"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                        {marca.tipo === "texto" ? (
                          <input
                            type="text"
                            value={marca.valor}
                            onChange={(e) =>
                              updateMarcaValor(marca.id, e.target.value)
                            }
                            className="w-full bg-white px-3 py-2 border border-slate-200 rounded-lg"
                            placeholder="Nombre de marca"
                            title="Nombre marca"
                          />
                        ) : (
                          <div className="flex items-center gap-4">
                            <div className="relative w-16 h-16 bg-white border border-slate-200 rounded-lg overflow-hidden flex items-center justify-center">
                              {marca.valor ? (
                                <Image
                                  src={marca.valor}
                                  alt="Marca"
                                  fill
                                  className="object-contain p-1"
                                />
                              ) : (
                                <ImageIcon className="w-6 h-6 text-slate-300" />
                              )}
                            </div>
                            <label
                              className="cursor-pointer bg-white border border-slate-200 text-slate-600 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-slate-50"
                              title="Subir imagen"
                            >
                              Subir Archivo{" "}
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={(e) =>
                                  handleBrandFileChange(marca.id, e)
                                }
                                title="Seleccionar archivo marca"
                              />
                            </label>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            )}

            {/* TAB ESTILO */}
            {activeTab === "estilo" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-800 mb-4">
                    Textos Home
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <label
                        htmlFor="titulo_home"
                        className="block text-sm font-semibold text-slate-700 mb-1"
                      >
                        Título Principal
                      </label>
                      <input
                        id="titulo_home"
                        type="text"
                        value={formData.texto_bienvenida_titulo}
                        onChange={(e) =>
                          handleChange(
                            "texto_bienvenida_titulo",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                        title="Título home"
                        placeholder="Bienvenido..."
                      />
                    </div>
                    <div>
                      <label
                        htmlFor="subtitulo_home"
                        className="block text-sm font-semibold text-slate-700 mb-1"
                      >
                        Subtítulo
                      </label>
                      <input
                        id="subtitulo_home"
                        type="text"
                        value={formData.texto_bienvenida_subtitulo}
                        onChange={(e) =>
                          handleChange(
                            "texto_bienvenida_subtitulo",
                            e.target.value,
                          )
                        }
                        className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                        title="Subtítulo home"
                        placeholder="El mejor lugar..."
                      />
                    </div>
                  </div>
                </section>
                <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <h2 className="text-lg font-bold text-slate-800 mb-4">
                    Colores
                  </h2>
                  <div className="grid grid-cols-1 gap-4">
                    <div>
                      <label
                        htmlFor="color_primario"
                        className="block text-sm font-semibold text-slate-700 mb-1"
                      >
                        Primario
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="color_primario"
                          type="color"
                          value={formData.color_primario}
                          onChange={(e) =>
                            handleChange("color_primario", e.target.value)
                          }
                          className="h-10 w-16 rounded cursor-pointer border"
                          title="Color primario"
                        />
                        <input
                          type="text"
                          value={formData.color_primario}
                          onChange={(e) =>
                            handleChange("color_primario", e.target.value)
                          }
                          className="flex-1 px-4 border border-slate-300 rounded-xl uppercase"
                          title="Código color primario"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                    <div>
                      <label
                        htmlFor="color_secundario"
                        className="block text-sm font-semibold text-slate-700 mb-1"
                      >
                        Secundario
                      </label>
                      <div className="flex gap-2">
                        <input
                          id="color_secundario"
                          type="color"
                          value={formData.color_secundario}
                          onChange={(e) =>
                            handleChange("color_secundario", e.target.value)
                          }
                          className="h-10 w-16 rounded cursor-pointer border"
                          title="Color secundario"
                        />
                        <input
                          type="text"
                          value={formData.color_secundario}
                          onChange={(e) =>
                            handleChange("color_secundario", e.target.value)
                          }
                          className="flex-1 px-4 border border-slate-300 rounded-xl uppercase"
                          title="Código color secundario"
                          placeholder="#000000"
                        />
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {/* TAB NOSOTROS Y GALERÍA (Mismo bloque de antes para Nosotros) */}
            {activeTab === "nosotros" && (
              <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
                <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
                  <div className="mb-4">
                    <label
                      htmlFor="historia_titulo"
                      className="block text-sm font-semibold text-slate-700 mb-1"
                    >
                      Título Nosotros
                    </label>
                    <input
                      id="historia_titulo"
                      type="text"
                      value={nosotrosData.historia_titulo}
                      onChange={(e) =>
                        handleNosotrosChange("historia_titulo", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl"
                      placeholder="Ej: Nuestra Historia"
                      title="Título nosotros"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="hero_descripcion"
                      className="block text-sm font-semibold text-slate-700 mb-1"
                    >
                      Resumen
                    </label>
                    <textarea
                      id="hero_descripcion"
                      rows={3}
                      value={nosotrosData.hero_descripcion}
                      onChange={(e) =>
                        handleNosotrosChange("hero_descripcion", e.target.value)
                      }
                      className="w-full px-4 py-2 border border-slate-300 rounded-xl resize-none"
                      placeholder="Breve descripción..."
                      title="Resumen nosotros"
                    />
                  </div>
                </section>
              </div>
            )}

            {(activeTab === "galeria" || activeTab === "nosotros") && (
              <section className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-bold text-slate-800">
                    Galería (Slider Home)
                  </h2>
                  <label
                    className="cursor-pointer text-blue-600 text-xs font-bold hover:bg-blue-50 px-3 py-1.5 rounded-lg flex gap-1 items-center transition-colors"
                    title="Agregar imágenes"
                  >
                    <Plus className="w-4 h-4" /> Agregar{" "}
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      className="hidden"
                      onChange={handleGallerySelect}
                      title="Seleccionar imágenes"
                    />
                  </label>
                </div>
                <div className="grid grid-cols-4 gap-3">
                  {nosotrosData.galeria_inicio.map((url, i) => (
                    <div
                      key={`saved-${i}`}
                      className="relative aspect-square rounded-xl overflow-hidden border border-slate-200 group shadow-sm hover:shadow-md transition-shadow"
                    >
                      <Image
                        src={url}
                        alt={`Galería ${i}`}
                        fill
                        className="object-cover"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(i, false)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        title="Eliminar imagen"
                        aria-label="Eliminar imagen"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                  {newGalleryPreviews.map((url, i) => (
                    <div
                      key={`new-${i}`}
                      className="relative aspect-square rounded-xl overflow-hidden border-2 border-green-400 group shadow-sm bg-green-50"
                    >
                      <Image
                        src={url}
                        alt="Nueva"
                        fill
                        className="object-cover opacity-90"
                      />
                      <button
                        type="button"
                        onClick={() => removeGalleryImage(i, true)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                        title="Cancelar subida"
                        aria-label="Cancelar subida"
                      >
                        <X className="w-3 h-3" />
                      </button>
                      <div className="absolute bottom-0 left-0 right-0 bg-green-500 text-white text-[9px] font-bold text-center py-0.5 uppercase tracking-wide">
                        Nueva
                      </div>
                    </div>
                  ))}
                  {nosotrosData.galeria_inicio.length === 0 &&
                    newGalleryPreviews.length === 0 && (
                      <div className="col-span-4 py-8 text-center text-slate-400 text-sm border-2 border-dashed border-slate-200 rounded-xl bg-slate-50">
                        No hay imágenes en la galería.
                      </div>
                    )}
                </div>
              </section>
            )}
          </div>

          <div className="sticky top-6 hidden lg:block">
            <div
              className="bg-[#0b0d12] rounded-[2rem] border-[10px] border-slate-800 shadow-2xl overflow-hidden h-[800px] relative flex flex-col"
              style={{
                ["--primary" as any]: formData.color_primario,
              }}
            >
              <div className="bg-slate-800 py-2 text-center text-xs text-slate-400">
                Vista Previa: {getPreviewTitle()}
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar relative flex flex-col">
                <div className="relative h-[300px] shrink-0 flex items-center justify-center">
                  {formData.imagen_hero_url ? (
                    isVideo(formData.imagen_hero_url) ? (
                      <video
                        src={formData.imagen_hero_url}
                        className="w-full h-full object-cover opacity-60"
                        autoPlay
                        loop
                        muted
                      />
                    ) : (
                      <Image
                        src={formData.imagen_hero_url}
                        alt="Hero"
                        fill
                        className="object-cover opacity-60"
                      />
                    )
                  ) : (
                    <div className="absolute inset-0 bg-blue-900/20" />
                  )}
                  <div className="relative z-10 text-center px-6 mt-6">
                    {formData.logo_url && (
                      <div className="relative w-20 h-20 mx-auto mb-2">
                        <Image
                          src={formData.logo_url}
                          alt="Logo"
                          fill
                          className="object-contain"
                        />
                      </div>
                    )}
                    <h2 className="text-xl font-bold text-white mb-1 leading-tight">
                      {formData.texto_bienvenida_titulo}
                    </h2>
                  </div>
                </div>
                <div
                  className="p-6 bg-[#0b0d12] flex-1"
                  style={{ backgroundColor: formData.color_secundario }}
                >
                  <div
                    className="inline-block px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-widest uppercase mb-3"
                    style={{ color: formData.color_primario }}
                  >
                    {activeTab === "nosotros"
                      ? "Sección Nosotros"
                      : "Contenido"}
                  </div>
                  <h2 className="text-2xl font-bold text-white mb-3">
                    {activeTab === "nosotros"
                      ? nosotrosData.historia_titulo || "Título"
                      : "Título de Sección"}
                  </h2>
                  <p className="text-gray-400 text-sm mb-4 line-clamp-3">
                    {activeTab === "nosotros"
                      ? nosotrosData.hero_descripcion || "Descripción..."
                      : "Contenido de ejemplo..."}
                  </p>

                  {(activeTab === "nosotros" || activeTab === "galeria") && (
                    <div className="grid grid-cols-3 gap-2 mt-4 opacity-70">
                      {[...nosotrosData.galeria_inicio, ...newGalleryPreviews]
                        .slice(0, 3)
                        .map((src, i) => (
                          <div
                            key={i}
                            className="aspect-square bg-white/10 rounded-lg overflow-hidden relative"
                          >
                            <Image
                              src={src}
                              alt="p"
                              fill
                              className="object-cover"
                            />
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
