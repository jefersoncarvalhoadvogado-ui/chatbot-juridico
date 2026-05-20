"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

const STATUS_CORES: Record<string, string> = {
  novo: "bg-blue-100 text-blue-800",
  em_contato: "bg-yellow-100 text-yellow-800",
  convertido: "bg-green-100 text-green-800",
  descartado: "bg-gray-100 text-gray-600",
};

export default function Dashboard() {
  const [leads, setLeads] = useState<any[]>([]);
  const [filtro, setFiltro] = useState("todos");

  useEffect(() => { buscarLeads(); }, []);

  async function buscarLeads() {
    const { data } = await supabase
      .from("leads")
      .select("*")
      .order("created_at", { ascending: false });
    setLeads(data || []);
  }

  async function atualizarStatus(id: string, novoStatus: string) {
    await supabase.from("leads").update({ status: novoStatus }).eq("id", id);
    buscarLeads();
  }

  const leadsFiltrados = filtro === "todos"
    ? leads
    : leads.filter((l) => l.status === filtro);

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Painel de Leads</h1>
        <p className="text-gray-500 mb-8">Escritório Jeferson Carvalho Advocacia</p>

        <div className="grid grid-cols-4 gap-4 mb-8">
          {["novo", "em_contato", "convertido", "descartado"].map((s) => (
            <div key={s} className="bg-white rounded-xl p-4 shadow-sm text-center">
              <p className="text-2xl font-bold text-gray-800">
                {leads.filter((l) => l.status === s).length}
              </p>
              <p className="text-sm text-gray-500 capitalize">{s.replace("_", " ")}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2 mb-6">
          {["todos", "novo", "em_contato", "convertido", "descartado"].map((f) => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                filtro === f ? "bg-blue-600 text-white" : "bg-white text-gray-600 border"
              }`}
            >
              {f.replace("_", " ")}
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead className="bg-gray-50 border-b">
              <tr>
                {["Nome", "Tipo", "Situação", "Cidade", "Advogado", "Status", "Ação"].map((h) => (
                  <th key={h} className="text-left p-4 text-sm font-semibold text-gray-600">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {leadsFiltrados.map((lead) => (
                <tr key={lead.id} className="border-b hover:bg-gray-50">
                  <td className="p-4 font-medium text-gray-800">{lead.nome}</td>
                  <td className="p-4 text-gray-600">{lead.tipo}</td>
                  <td className="p-4 text-gray-600">{lead.situacao}</td>
                  <td className="p-4 text-gray-600">{lead.cidade}</td>
                  <td className="p-4 text-gray-600">{lead.advogado}</td>
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_CORES[lead.status]}`}>
                      {lead.status}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex gap-2">
                      
                        href={`https://wa.me/${lead.telefone}`}
                        target="_blank"
                        className="text-xs bg-green-500 text-white px-3 py-1 rounded-full"
                      >
                        WhatsApp
                      </a>
                      <select
                        onChange={(e) => atualizarStatus(lead.id, e.target.value)}
                        defaultValue={lead.status}
                        className="text-xs border rounded px-2 py-1"
                      >
                        <option value="novo">Novo</option>
                        <option value="em_contato">Em contato</option>
                        <option value="convertido">Convertido</option>
                        <option value="descartado">Descartado</option>
                      </select>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {leadsFiltrados.length === 0 && (
            <p className="text-center text-gray-400 py-12">Nenhum lead ainda</p>
          )}
        </div>
      </div>
    </div>
  );
}