"use client"

import { useState, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Clock, User, CheckCircle, MapPin, Calendar, Scissors, Instagram, Phone } from "lucide-react"

const CHAT_STEPS = {
  GREETING: "greeting",
  CPF_VERIFICATION: "cpf_verification",
  MENU_OPTIONS: "menu_options",
  NAME_INPUT: "name_input",
  SERVICE_SELECTION: "service_selection",
  DATE_SELECTION: "date_selection",
  BARBER_SELECTION: "barber_selection",
  TIME_SELECTION: "time_selection",
  SUMMARY: "summary",
  SUCCESS: "success",
  VIEW_APPOINTMENTS: "view_appointments",
  SOCIAL_MEDIA: "social_media",
}

export default function Home() {
  const [messages, setMessages] = useState([])
  const [currentStep, setCurrentStep] = useState(CHAT_STEPS.GREETING)
  const [userInput, setUserInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const [showOptions, setShowOptions] = useState(false)
  const [userData, setUserData] = useState({
    phone: "5563999887766",
    name: "",
    cpf: "",
    customerId: null,
    isRegistered: false,
    service: null,
    selectedDate: null,
    barber: null,
    time: "",
  })
  const [services, setServices] = useState([])
  const [barbers, setBarbers] = useState([])
  const [availableBarbers, setAvailableBarbers] = useState([])
  const [availableTimes, setAvailableTimes] = useState([])
  const [userAppointments, setUserAppointments] = useState([])

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages, showOptions])

  useEffect(() => {
    startChat()
    fetchServices()
    fetchBarbers()
  }, [])

  // Função para fazer requisições ao Supabase
  const supabaseRequest = async (endpoint, options = {}) => {
    const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/${endpoint}`
    const headers = {
      apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
      "Content-Type": "application/json",
      Prefer: "return=representation",
      ...options.headers,
    }

    try {
      console.log(`Fazendo requisição para: ${url}`)
      const response = await fetch(url, {
        ...options,
        headers,
      })

      console.log(`Status da resposta: ${response.status}`)

      if (!response.ok) {
        const errorText = await response.text()
        console.error("Erro na resposta:", response.status, errorText)
        return null
      }

      const data = await response.json()
      console.log("Dados recebidos:", data)
      return data
    } catch (error) {
      console.error("Erro na requisição:", error)
      return null
    }
  }

  // Buscar cliente por CPF
  const checkCustomerByCPF = async (cpf) => {
    try {
      const cleanCpf = cpf.replace(/\D/g, "")
      console.log("Buscando cliente com CPF:", cleanCpf)

      const data = await supabaseRequest(`customers?cpf=eq.${cleanCpf}`)

      if (data && data.length > 0) {
        console.log("Cliente encontrado:", data[0])
        return data[0]
      }

      console.log("Cliente não encontrado")
      return null
    } catch (error) {
      console.error("Erro ao buscar cliente:", error)
      return null
    }
  }

  // Buscar agendamentos do cliente
  const fetchCustomerAppointments = async (customerId) => {
    try {
      console.log("Buscando agendamentos do cliente:", customerId)

      const data = await supabaseRequest(
        `appointments?customer_id=eq.${customerId}&select=*,services(*),barbers(*)&order=appointment_date.desc,appointment_time.desc`,
      )

      if (data && Array.isArray(data)) {
        console.log("Agendamentos encontrados:", data)
        setUserAppointments(data)
        return data
      }
      return []
    } catch (error) {
      console.error("Erro ao buscar agendamentos:", error)
      return []
    }
  }

  // Buscar serviços
  const fetchServices = async () => {
    try {
      const data = await supabaseRequest("services?select=*&order=id")
      if (data && Array.isArray(data)) {
        console.log("Serviços carregados:", data)
        setServices(data)
      }
    } catch (error) {
      console.error("Erro ao buscar serviços:", error)
    }
  }

  // Buscar barbeiros
  const fetchBarbers = async () => {
    try {
      const data = await supabaseRequest("barbers?select=*&order=id")
      if (data && Array.isArray(data)) {
        console.log("Barbeiros carregados:", data)
        setBarbers(data)
      }
    } catch (error) {
      console.error("Erro ao buscar barbeiros:", error)
    }
  }

  // Cadastrar cliente
  const registerCustomer = async (customerData) => {
    try {
      console.log("Cadastrando cliente:", customerData)
      const data = await supabaseRequest("customers", {
        method: "POST",
        body: JSON.stringify(customerData),
      })

      if (data && data.length > 0) {
        console.log("Cliente cadastrado com sucesso:", data[0])
        setUserData((prev) => ({ ...prev, customerId: data[0].id }))
        return true
      }
      return false
    } catch (error) {
      console.error("Erro ao cadastrar cliente:", error)
      return false
    }
  }

  // Verificar se horário está disponível
  const checkTimeAvailability = async (barberId, date, time) => {
    try {
      const appointmentDate = date.toISOString().split("T")[0]
      console.log("Verificando disponibilidade:", { barberId, appointmentDate, time })

      const data = await supabaseRequest(
        `appointments?barber_id=eq.${barberId}&appointment_date=eq.${appointmentDate}&appointment_time=eq.${time}`,
      )

      const isAvailable = !data || data.length === 0
      console.log("Horário disponível:", isAvailable)
      return isAvailable
    } catch (error) {
      console.error("Erro ao verificar disponibilidade:", error)
      return false
    }
  }

  // Salvar agendamento
  const saveAppointment = async (appointmentData) => {
    try {
      console.log("Salvando agendamento:", appointmentData)

      // Verificar se o horário ainda está disponível
      const isAvailable = await checkTimeAvailability(
        appointmentData.barber_id,
        userData.selectedDate,
        appointmentData.appointment_time,
      )

      if (!isAvailable) {
        console.log("Horário não está mais disponível")
        return false
      }

      const data = await supabaseRequest("appointments", {
        method: "POST",
        body: JSON.stringify(appointmentData),
      })

      if (data && data.length > 0) {
        console.log("Agendamento salvo com sucesso:", data[0])
        return true
      }
      return false
    } catch (error) {
      console.error("Erro ao salvar agendamento:", error)
      return false
    }
  }

  // Gerar datas disponíveis
  const generateAvailableDates = () => {
    const dates = []
    const currentDate = new Date()

    while (dates.length < 5) {
      if (currentDate.getDay() !== 0) {
        dates.push(new Date(currentDate))
      }
      currentDate.setDate(currentDate.getDate() + 1)
    }

    return dates
  }

  // Verificar barbeiros disponíveis para uma data
  const getAvailableBarbersForDate = (date) => {
    const weekDays = {
      0: "Domingo",
      1: "Segunda-feira",
      2: "Terça-feira",
      3: "Quarta-feira",
      4: "Quinta-feira",
      5: "Sexta-feira",
      6: "Sábado",
    }
    const dayOfWeek = weekDays[date.getDay()]
    return barbers.filter((barber) => barber.day_off !== dayOfWeek)
  }

  // Gerar horários disponíveis
  const generateAvailableTimes = async (barber, service, date) => {
    const times = []
    const serviceDuration = service.duration_minutes / 60

    // Horários da manhã
    if (barber.morning_shift) {
      const [start, end] = barber.morning_shift.split("-")
      const startHour = Number.parseInt(start.split(":")[0])
      const endHour = Number.parseInt(end.split(":")[0])

      for (let hour = startHour; hour < endHour; hour += serviceDuration) {
        const hourInt = Math.floor(hour)
        const minuteInt = Math.round((hour - hourInt) * 60)
        const timeSlot = `${hourInt.toString().padStart(2, "0")}:${minuteInt.toString().padStart(2, "0")}`

        // Verificar se o horário está disponível
        const isAvailable = await checkTimeAvailability(barber.id, date, timeSlot)
        if (isAvailable) {
          times.push(timeSlot)
        }
      }
    }

    // Horários da tarde
    if (barber.afternoon_shift) {
      const [start, end] = barber.afternoon_shift.split("-")
      const startHour = Number.parseInt(start.split(":")[0])
      const endHour = Number.parseInt(end.split(":")[0])

      for (let hour = startHour; hour < endHour; hour += serviceDuration) {
        const hourInt = Math.floor(hour)
        const minuteInt = Math.round((hour - hourInt) * 60)
        const timeSlot = `${hourInt.toString().padStart(2, "0")}:${minuteInt.toString().padStart(2, "0")}`

        // Verificar se o horário está disponível
        const isAvailable = await checkTimeAvailability(barber.id, date, timeSlot)
        if (isAvailable) {
          times.push(timeSlot)
        }
      }
    }

    return times
  }

  const startChat = () => {
    setMessages([])
    setCurrentStep(CHAT_STEPS.GREETING)
    setShowOptions(false)
    setUserData((prev) => ({
      ...prev,
      name: "",
      cpf: "",
      customerId: null,
      isRegistered: false,
      service: null,
      selectedDate: null,
      barber: null,
      time: "",
    }))

    setTimeout(() => {
      addBotMessage("Olá! Bem-vindo à Barbearia KendyBlack! 💈")
      setTimeout(() => {
        addBotMessage("Para começarmos, por favor informe seu CPF (apenas números):")
        setCurrentStep(CHAT_STEPS.CPF_VERIFICATION)
      }, 1000)
    }, 500)
  }

  const addBotMessage = (text) => {
    setIsTyping(true)
    setShowOptions(false)

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          type: "bot",
          text,
          timestamp: new Date(),
          id: Date.now() + Math.random(),
        },
      ])
      setIsTyping(false)
    }, 1000)
  }

  const addUserMessage = (text) => {
    setMessages((prev) => [
      ...prev,
      {
        type: "user",
        text,
        timestamp: new Date(),
        id: Date.now() + Math.random(),
      },
    ])
  }

  const handleSendMessage = () => {
    if (!userInput.trim()) return

    addUserMessage(userInput)
    processUserInput(userInput)
    setUserInput("")
  }

  const processUserInput = async (input) => {
    switch (currentStep) {
      case CHAT_STEPS.CPF_VERIFICATION:
        const cleanCpf = input.replace(/\D/g, "")
        if (cleanCpf.length === 11) {
          const formattedCpf = cleanCpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4")
          setUserData((prev) => ({ ...prev, cpf: formattedCpf }))

          const customer = await checkCustomerByCPF(cleanCpf)

          if (customer) {
            const firstName = customer.name.split(" ")[0]
            setUserData((prev) => ({
              ...prev,
              name: customer.name,
              customerId: customer.id,
              isRegistered: true,
            }))

            setTimeout(() => {
              addBotMessage(`Olá ${firstName}! Seja bem-vindo à Barbearia KendyBlack 💈`)
              setTimeout(() => {
                showMenuOptions()
              }, 1000)
            }, 500)
          } else {
            setTimeout(() => {
              addBotMessage("CPF não encontrado em nossa base de dados.")
              setTimeout(() => {
                addBotMessage("Informe seu nome completo para agilizar seu atendimento!")
                setCurrentStep(CHAT_STEPS.NAME_INPUT)
              }, 1000)
            }, 500)
          }
        } else {
          setTimeout(() => {
            addBotMessage("Por favor, digite um CPF válido com 11 dígitos:")
          }, 500)
        }
        break

      case CHAT_STEPS.NAME_INPUT:
        if (input.trim().split(" ").length >= 2) {
          setUserData((prev) => ({ ...prev, name: input.trim() }))

          const customerData = {
            name: input.trim(),
            cpf: userData.cpf.replace(/\D/g, ""),
            phone: userData.phone,
          }

          const success = await registerCustomer(customerData)

          if (success) {
            setTimeout(() => {
              addBotMessage(`Obrigado ${input.trim().split(" ")[0]}! Seu cadastro foi realizado com sucesso. ✅`)
              setTimeout(() => {
                showMenuOptions()
              }, 1000)
            }, 500)
          } else {
            setTimeout(() => {
              addBotMessage("Desculpe, tivemos um problema ao registrar seu cadastro. Vamos tentar novamente.")
              setTimeout(() => {
                setCurrentStep(CHAT_STEPS.NAME_INPUT)
              }, 1000)
            }, 500)
          }
        } else {
          setTimeout(() => {
            addBotMessage("Por favor, digite seu nome completo (nome e sobrenome):")
          }, 500)
        }
        break
    }
  }

  const showMenuOptions = () => {
    setTimeout(() => {
      addBotMessage("O que você deseja fazer hoje?")
      setTimeout(() => {
        setCurrentStep(CHAT_STEPS.MENU_OPTIONS)
        setShowOptions(true)
      }, 500)
    }, 500)
  }

  const handleMenuOptionSelect = async (option) => {
    setShowOptions(false)

    switch (option) {
      case "agendar":
        addUserMessage("✂️ Agendar corte")
        showServiceSelection()
        break

      case "agendamentos":
        addUserMessage("📅 Ver meus agendamentos")
        if (userData.customerId) {
          const appointments = await fetchCustomerAppointments(userData.customerId)

          if (appointments.length > 0) {
            setTimeout(() => {
              addBotMessage("Aqui estão seus agendamentos:")
              setTimeout(() => {
                setCurrentStep(CHAT_STEPS.VIEW_APPOINTMENTS)
                setShowOptions(true)
              }, 500)
            }, 500)
          } else {
            setTimeout(() => {
              addBotMessage("Você não possui agendamentos. Deseja agendar um corte agora?")
              setTimeout(() => {
                showMenuOptions()
              }, 500)
            }, 500)
          }
        } else {
          setTimeout(() => {
            addBotMessage("Não consegui encontrar seus dados. Vamos tentar novamente.")
            setTimeout(() => {
              startChat()
            }, 1000)
          }, 500)
        }
        break

      case "social":
        addUserMessage("📱 Redes sociais")
        setTimeout(() => {
          addBotMessage("Aqui estão nossas redes sociais:")
          setTimeout(() => {
            setCurrentStep(CHAT_STEPS.SOCIAL_MEDIA)
            setShowOptions(true)
          }, 500)
        }, 500)
        break
    }
  }

  const showServiceSelection = () => {
    setTimeout(() => {
      addBotMessage("Qual serviço você deseja agendar hoje?")
      setTimeout(() => {
        setCurrentStep(CHAT_STEPS.SERVICE_SELECTION)
        setShowOptions(true)
      }, 500)
    }, 500)
  }

  const handleServiceSelect = (service) => {
    setUserData((prev) => ({ ...prev, service }))
    setShowOptions(false)
    addUserMessage(`${service.name} - R$ ${service.price.toFixed(2)}`)

    setTimeout(() => {
      addBotMessage(`Excelente escolha! ${service.name} por R$ ${service.price.toFixed(2)} 💰`)
      setTimeout(() => {
        addBotMessage("Agora, escolha uma data para o atendimento:")
        setTimeout(() => {
          setCurrentStep(CHAT_STEPS.DATE_SELECTION)
          setShowOptions(true)
        }, 500)
      }, 1000)
    }, 500)
  }

  const handleDateSelect = (date) => {
    setUserData((prev) => ({ ...prev, selectedDate: date }))
    setShowOptions(false)

    const formattedDate = date.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    })

    addUserMessage(`📅 ${formattedDate}`)

    const availableBarbersForDate = getAvailableBarbersForDate(date)
    setAvailableBarbers(availableBarbersForDate)

    if (availableBarbersForDate.length === 0) {
      setTimeout(() => {
        addBotMessage("Desculpe, não temos barbeiros disponíveis nesta data. Por favor, escolha outra data.")
        setTimeout(() => {
          setCurrentStep(CHAT_STEPS.DATE_SELECTION)
          setShowOptions(true)
        }, 1000)
      }, 500)
    } else {
      setTimeout(() => {
        addBotMessage("Agora, escolha um barbeiro disponível:")
        setTimeout(() => {
          setCurrentStep(CHAT_STEPS.BARBER_SELECTION)
          setShowOptions(true)
        }, 500)
      }, 500)
    }
  }

  const handleBarberSelect = async (barber) => {
    setUserData((prev) => ({ ...prev, barber }))
    setShowOptions(false)
    addUserMessage(`👨‍💼 ${barber.name}`)

    const times = await generateAvailableTimes(barber, userData.service, userData.selectedDate)
    setAvailableTimes(times)

    setTimeout(() => {
      addBotMessage(`Ótimo! ${barber.name} é uma excelente escolha!`)
      setTimeout(() => {
        if (times.length === 0) {
          addBotMessage("Desculpe, não há horários disponíveis para este barbeiro nesta data. Escolha outro barbeiro:")
          setTimeout(() => {
            setCurrentStep(CHAT_STEPS.BARBER_SELECTION)
            setShowOptions(true)
          }, 500)
        } else {
          addBotMessage("Agora, escolha um horário disponível:")
          setTimeout(() => {
            setCurrentStep(CHAT_STEPS.TIME_SELECTION)
            setShowOptions(true)
          }, 500)
        }
      }, 1000)
    }, 500)
  }

  const handleTimeSelect = (time) => {
    setUserData((prev) => ({ ...prev, time }))
    setShowOptions(false)
    addUserMessage(`🕐 ${time}`)

    setTimeout(() => {
      addBotMessage("Perfeito! Vamos revisar os detalhes do seu agendamento:")
      setTimeout(() => {
        setCurrentStep(CHAT_STEPS.SUMMARY)
        setShowOptions(true)
      }, 800)
    }, 500)
  }

  const handleConfirmBooking = async () => {
    setShowOptions(false)
    addUserMessage("✅ Confirmar agendamento")

    const appointmentDate = userData.selectedDate.toISOString().split("T")[0]

    const appointmentData = {
      customer_id: userData.customerId,
      service_id: userData.service.id,
      barber_id: userData.barber.id,
      appointment_date: appointmentDate,
      appointment_time: userData.time,
      customer_attended: false,
    }

    if (!appointmentData.customer_id) {
      setTimeout(() => {
        addBotMessage("Erro: Dados do cliente não encontrados. Por favor, reinicie o processo.")
        setTimeout(() => {
          startChat()
        }, 2000)
      }, 500)
      return
    }

    const success = await saveAppointment(appointmentData)

    if (success) {
      setTimeout(() => {
        addBotMessage("🎉 Agendamento realizado com sucesso!")
        setTimeout(() => {
          const firstName = userData.name.split(" ")[0]
          addBotMessage(
            `Obrigado por escolher nossa barbearia, ${firstName}! Te esperamos no dia ${userData.selectedDate.toLocaleDateString("pt-BR")} às ${userData.time}. Até logo! 👋`,
          )
          setTimeout(() => {
            addBotMessage("📍 Venha nos visitar:")
            setTimeout(() => {
              setCurrentStep(CHAT_STEPS.SUCCESS)
              setShowOptions(true)
            }, 500)
          }, 1000)
        }, 1000)
      }, 500)
    } else {
      setTimeout(() => {
        addBotMessage("Desculpe, este horário não está mais disponível. Por favor, escolha outro horário:")
        setTimeout(() => {
          setCurrentStep(CHAT_STEPS.TIME_SELECTION)
          setShowOptions(true)
        }, 500)
      }, 500)
    }
  }

  const TypingIndicator = () => (
    <div className="flex items-center space-x-2 p-3 bg-zinc-800 rounded-lg max-w-20">
      <div className="flex space-x-1">
        <div className="w-2 h-2 bg-zinc-400 rounded-full typing-dot"></div>
        <div className="w-2 h-2 bg-zinc-400 rounded-full typing-dot delay-1"></div>
        <div className="w-2 h-2 bg-zinc-400 rounded-full typing-dot delay-2"></div>
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-zinc-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl mx-auto">
        <Card className="h-[90vh] max-h-[800px] bg-zinc-900 border-zinc-800 shadow-lg rounded-lg overflow-hidden">
          {/* Header */}
          <div className="flex items-center p-4 border-b border-zinc-800 bg-zinc-900">
            <Avatar className="w-10 h-10 mr-3">
              <AvatarFallback className="bg-zinc-800 text-zinc-100">💈</AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-semibold text-zinc-100">Kendy Black</h2>
              <p className="text-sm text-zinc-400">Assistente Virtual</p>
            </div>
            <Badge className="ml-auto bg-green-900 text-green-300">Online</Badge>
          </div>

          <CardContent className="flex flex-col h-full p-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4 chat-container">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === "user" ? "justify-end" : "justify-start"} message-item`}
                >
                  <div
                    className={`max-w-[85%] px-4 py-3 rounded-lg ${
                      message.type === "user"
                        ? "bg-blue-600 text-white rounded-br-sm"
                        : "bg-zinc-800 text-zinc-100 rounded-bl-sm"
                    }`}
                  >
                    <p className="text-base leading-relaxed whitespace-pre-line">{message.text}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {message.timestamp.toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <TypingIndicator />
                </div>
              )}

              {showOptions && (
                <div className="options-container">
                  {/* Menu de opções */}
                  {currentStep === CHAT_STEPS.MENU_OPTIONS && (
                    <div className="grid grid-cols-1 gap-3 mt-4">
                      <Button
                        variant="outline"
                        className="justify-start h-auto p-4 bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-left"
                        onClick={() => handleMenuOptionSelect("agendar")}
                      >
                        <div className="flex items-center space-x-3">
                          <Scissors className="w-5 h-5 text-zinc-400" />
                          <div>
                            <div className="font-medium">Agendar corte</div>
                            <div className="text-xs text-zinc-400">Marque seu horário</div>
                          </div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        className="justify-start h-auto p-4 bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-left"
                        onClick={() => handleMenuOptionSelect("agendamentos")}
                      >
                        <div className="flex items-center space-x-3">
                          <Calendar className="w-5 h-5 text-zinc-400" />
                          <div>
                            <div className="font-medium">Ver meus agendamentos</div>
                            <div className="text-xs text-zinc-400">Consulte seus horários marcados</div>
                          </div>
                        </div>
                      </Button>

                      <Button
                        variant="outline"
                        className="justify-start h-auto p-4 bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-left"
                        onClick={() => handleMenuOptionSelect("social")}
                      >
                        <div className="flex items-center space-x-3">
                          <Instagram className="w-5 h-5 text-zinc-400" />
                          <div>
                            <div className="font-medium">Redes sociais</div>
                            <div className="text-xs text-zinc-400">Instagram e WhatsApp</div>
                          </div>
                        </div>
                      </Button>
                    </div>
                  )}

                  {/* Redes sociais */}
                  {currentStep === CHAT_STEPS.SOCIAL_MEDIA && (
                    <div className="grid grid-cols-1 gap-3 mt-4">
                      <Card className="bg-zinc-800 border-zinc-700">
                        <CardContent className="p-4">
                          <h3 className="font-semibold mb-3 text-zinc-100">Barbearia KendyBlack</h3>
                          <div className="space-y-4">
                            <div className="flex items-center">
                              <Phone className="w-5 h-5 text-green-500 mr-3" />
                              <div>
                                <div className="text-sm font-medium">WhatsApp</div>
                                <a
                                  href="https://wa.me/5563981524895"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 text-sm"
                                >
                                  (63) 98152-4895
                                </a>
                              </div>
                            </div>

                            <div className="flex items-center">
                              <Instagram className="w-5 h-5 text-pink-500 mr-3" />
                              <div>
                                <div className="text-sm font-medium">Instagram</div>
                                <a
                                  href="https://instagram.com/BarbeariaKendyBlack"
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 text-sm"
                                >
                                  @BarbeariaKendyBlack
                                </a>
                              </div>
                            </div>

                            <div className="flex items-center">
                              <MapPin className="w-5 h-5 text-red-500 mr-3" />
                              <div>
                                <div className="text-sm font-medium">Endereço</div>
                                <p className="text-xs text-zinc-300">
                                  AVENIDA FRANCISCO GALVAO DA CRUZ
                                  <br />
                                  Quadra 10 Lote 3 Sala 8, SN
                                  <br />
                                  Setor Santa Fé (Taquaralto), Palmas - TO
                                </p>
                              </div>
                            </div>
                          </div>

                          <Button className="w-full mt-4 bg-zinc-700 hover:bg-zinc-600" onClick={showMenuOptions}>
                            Voltar ao menu
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {/* Ver agendamentos */}
                  {currentStep === CHAT_STEPS.VIEW_APPOINTMENTS && (
                    <div className="grid grid-cols-1 gap-3 mt-4">
                      {userAppointments.map((appointment, index) => (
                        <Card key={index} className="bg-zinc-800 border-zinc-700">
                          <CardContent className="p-4">
                            <div className="flex justify-between items-center mb-2">
                              <h3 className="font-semibold text-zinc-100">{appointment.services?.name}</h3>
                              <Badge variant={appointment.customer_attended ? "default" : "secondary"}>
                                {appointment.customer_attended ? "Concluído" : "Pendente"}
                              </Badge>
                            </div>
                            <div className="space-y-1 text-sm">
                              <div className="flex items-center">
                                <Calendar className="w-4 h-4 mr-2 text-zinc-400" />
                                <span>
                                  {new Date(appointment.appointment_date).toLocaleDateString("pt-BR", {
                                    weekday: "long",
                                    day: "numeric",
                                    month: "long",
                                  })}
                                </span>
                              </div>
                              <div className="flex items-center">
                                <Clock className="w-4 h-4 mr-2 text-zinc-400" />
                                <span>{appointment.appointment_time}</span>
                              </div>
                              <div className="flex items-center">
                                <User className="w-4 h-4 mr-2 text-zinc-400" />
                                <span>{appointment.barbers?.name}</span>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}

                      <Button className="w-full mt-2 bg-zinc-700 hover:bg-zinc-600" onClick={showMenuOptions}>
                        Voltar ao menu
                      </Button>
                    </div>
                  )}

                  {/* Seleção de serviços */}
                  {currentStep === CHAT_STEPS.SERVICE_SELECTION && (
                    <div className="grid grid-cols-1 gap-3 mt-4">
                      {services.map((service) => (
                        <Button
                          key={service.id}
                          variant="outline"
                          className="justify-between h-auto p-4 bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-left"
                          onClick={() => handleServiceSelect(service)}
                        >
                          <div className="flex items-center space-x-3">
                            <Scissors className="w-5 h-5 text-zinc-400" />
                            <div>
                              <div className="font-medium">{service.name}</div>
                              <div className="text-xs text-zinc-400">{service.duration_minutes} min</div>
                            </div>
                          </div>
                          <Badge variant="secondary" className="bg-zinc-700 text-zinc-200">
                            R$ {service.price.toFixed(2)}
                          </Badge>
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Seleção de data */}
                  {currentStep === CHAT_STEPS.DATE_SELECTION && (
                    <div className="grid grid-cols-1 gap-3 mt-4">
                      {generateAvailableDates().map((date, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          className="justify-start h-auto p-4 bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-left"
                          onClick={() => handleDateSelect(date)}
                        >
                          <div className="flex items-center space-x-3">
                            <Calendar className="w-5 h-5 text-zinc-400" />
                            <div>
                              <div className="font-medium">
                                {date.toLocaleDateString("pt-BR", {
                                  weekday: "long",
                                  day: "numeric",
                                  month: "long",
                                })}
                              </div>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Seleção de barbeiro */}
                  {currentStep === CHAT_STEPS.BARBER_SELECTION && (
                    <div className="grid grid-cols-1 gap-3 mt-4">
                      {availableBarbers.map((barber) => (
                        <Button
                          key={barber.id}
                          variant="outline"
                          className="justify-start h-auto p-4 bg-zinc-800 border-zinc-700 hover:bg-zinc-700 text-left"
                          onClick={() => handleBarberSelect(barber)}
                        >
                          <div className="flex items-center space-x-3">
                            <User className="w-5 h-5 text-zinc-400" />
                            <div>
                              <div className="font-medium">{barber.name}</div>
                              <div className="text-xs text-zinc-400">
                                {barber.morning_shift && `Manhã: ${barber.morning_shift}`}
                                {barber.morning_shift && barber.afternoon_shift && " | "}
                                {barber.afternoon_shift && `Tarde: ${barber.afternoon_shift}`}
                              </div>
                            </div>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Seleção de horário */}
                  {currentStep === CHAT_STEPS.TIME_SELECTION && (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                      {availableTimes.map((time) => (
                        <Button
                          key={time}
                          variant="outline"
                          className="bg-zinc-800 border-zinc-700 hover:bg-zinc-700 p-3"
                          onClick={() => handleTimeSelect(time)}
                        >
                          <div className="flex items-center space-x-1">
                            <Clock className="w-3 h-3" />
                            <span className="text-sm">{time}</span>
                          </div>
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Resumo do agendamento */}
                  {currentStep === CHAT_STEPS.SUMMARY && (
                    <Card className="mt-4 bg-zinc-800 border-zinc-700">
                      <CardContent className="p-4">
                        <h3 className="font-semibold mb-3 text-zinc-100">Resumo do Agendamento</h3>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Nome:</span>
                            <span className="text-zinc-100">{userData.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">CPF:</span>
                            <span className="text-zinc-100">{userData.cpf}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Serviço:</span>
                            <span className="text-zinc-100">{userData.service?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Preço:</span>
                            <span className="text-green-400">R$ {userData.service?.price.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Data:</span>
                            <span className="text-zinc-100">
                              {userData.selectedDate?.toLocaleDateString("pt-BR", {
                                weekday: "long",
                                day: "numeric",
                                month: "long",
                              })}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Barbeiro:</span>
                            <span className="text-zinc-100">{userData.barber?.name}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Horário:</span>
                            <span className="text-zinc-100">{userData.time}</span>
                          </div>
                        </div>
                        <Button className="w-full mt-4 bg-green-600 hover:bg-green-700" onClick={handleConfirmBooking}>
                          <CheckCircle className="w-4 h-4 mr-2" />
                          Confirmar Agendamento
                        </Button>
                      </CardContent>
                    </Card>
                  )}

                  {/* Mapa e novo agendamento */}
                  {currentStep === CHAT_STEPS.SUCCESS && (
                    <div className="space-y-4 mt-4">
                      <div className="bg-zinc-800 rounded-lg overflow-hidden">
                        <div className="aspect-video relative">
                          <iframe
                            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3958.9651942965!2d-48.35066492394827!3d-10.2830799840036!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x9324cb5e2bb4fb7f%3A0x5e3c39f32d7b1e2e!2sAv.%20Francisco%20Galv%C3%A3o%20da%20Cruz%20-%20Taquaralto%2C%20Palmas%20-%20TO!5e0!3m2!1spt-BR!2sbr!4v1717694661175!5m2!1spt-BR!2sbr"
                            width="100%"
                            height="100%"
                            style={{ border: 0, position: "absolute", top: 0, left: 0 }}
                            allowFullScreen=""
                            loading="lazy"
                            referrerPolicy="no-referrer-when-downgrade"
                          ></iframe>
                        </div>
                        <div className="p-3 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-white">Barbearia KendyBlack</p>
                            <p className="text-xs text-zinc-400">
                              Av. Francisco Galvão da Cruz, Taquaralto, Palmas - TO
                            </p>
                          </div>
                          <a
                            href="https://maps.app.goo.gl/B2CupeC1SVKrGHAu8"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-600 text-white text-xs py-1 px-3 rounded-full flex items-center"
                          >
                            <MapPin className="w-3 h-3 mr-1" />
                            Abrir
                          </a>
                        </div>
                      </div>
                      <Button onClick={showMenuOptions} className="w-full bg-zinc-700 hover:bg-zinc-600">
                        Voltar ao menu
                      </Button>
                    </div>
                  )}
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input estilo Typebot */}
            {(currentStep === CHAT_STEPS.CPF_VERIFICATION || currentStep === CHAT_STEPS.NAME_INPUT) && (
              <div className="p-6">
                <div className="flex items-center">
                  <Input
                    ref={inputRef}
                    value={userInput}
                    onChange={(e) => setUserInput(e.target.value)}
                    placeholder={
                      currentStep === CHAT_STEPS.CPF_VERIFICATION
                        ? "Digite seu CPF (apenas números)..."
                        : "Informe seu nome"
                    }
                    className="flex-1 bg-zinc-800 border-zinc-700 text-zinc-100 placeholder-zinc-400 text-base focus:ring-0 focus:outline-none rounded-r-none h-12"
                    onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                    disabled={isTyping}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!userInput.trim() || isTyping}
                    className="bg-orange-500 hover:bg-orange-600 rounded-l-none h-12 px-6"
                  >
                    Enviar
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
